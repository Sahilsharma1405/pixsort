import sys
from pathlib import Path
from typing import List, Set, Dict
import json

# Computer Vision and ML
import cv2
import numpy as np
import torch
import nltk
from PIL import Image
from nltk.corpus.reader.wordnet import Synset
from ultralytics import YOLO
from torchvision import models
from torchvision.models import ResNet50_Weights

# --- One-time NLTK setup ---
try:
    from nltk.corpus import wordnet
    wordnet.ensure_loaded()
except LookupError:
    print("[INFO] First time setup: Downloading WordNet data...")
    nltk.download("wordnet")
    from nltk.corpus import wordnet
    print("[INFO] WordNet download complete.")

# --- EAGER LOAD MODELS ON STARTUP (This is the fix for the timeout) ---
print("[STARTUP] Loading YOLOv8n model into memory...")
YOLO_MODEL = YOLO("yolov8n.pt")
print("[STARTUP] YOLOv8n model loaded successfully.")

print("[STARTUP] Loading ResNet50 model into memory...")
RESNET_WEIGHTS = ResNet50_Weights.DEFAULT
RESNET_MODEL = models.resnet50(weights=RESNET_WEIGHTS)
RESNET_MODEL.eval()
RESNET_PREPROCESS = RESNET_WEIGHTS.transforms()
RESNET_CATEGORIES = RESNET_WEIGHTS.meta["categories"]
print("[STARTUP] ResNet50 model loaded successfully.")


# --- Helper Functions (from your script) ---
def load_category_map_from_json(file_path: str) -> Dict[str, List[Synset]]:
    try:
        with open(file_path, "r") as f:
            json_data = json.load(f)
    except FileNotFoundError:
        # For a Django app, it's better to raise an error than to exit
        raise FileNotFoundError(f"❌ Error: Category file not found at '{file_path}'. Make sure 'categories.json' exists.")
    except json.JSONDecodeError:
        raise json.JSONDecodeError(f"❌ Error: Could not parse '{file_path}'. Make sure it is a valid JSON file.")
    
    category_map = {}
    for category, synset_strings in json_data.items():
        try:
            category_map[category] = [wordnet.synset(s) for s in synset_strings]
        except Exception as e:
            print(f"⚠️ Warning: Could not understand a synset for category '{category}'. Error: {e}")
    print("[INFO] Successfully loaded category map from categories.json")
    return category_map

def get_hypernym_chain(synset: Synset) -> Set[Synset]:
    hypernyms = set()
    for s in synset.hypernyms():
        hypernyms.update(get_hypernym_chain(s))
    return hypernyms | {synset}

def get_general_category(word: str, category_map: Dict[str, List[Synset]]) -> str | None:
    search_word = word.replace(" ", "_")
    try:
        synsets = wordnet.synsets(search_word)
        if not synsets:
            return None
        all_hypernyms = get_hypernym_chain(synsets[0])
        for category_name, trigger_synsets in category_map.items():
            for trigger in trigger_synsets:
                if trigger in all_hypernyms:
                    return category_name
    except Exception as e:
        print(f"WordNet error for word '{search_word}': {e}")
    return None

def load_image_bgr(image_path: Path) -> np.ndarray:
    image = cv2.imdecode(np.fromfile(str(image_path), dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError(f"Failed to load image: {image_path}")
    return image

def detect_faces_and_people(image_bgr: np.ndarray) -> bool:
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
    if len(faces) > 0:
        return True
    
    hog = cv2.HOGDescriptor()
    hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
    rects, _ = hog.detectMultiScale(image_bgr, winStride=(4, 4), padding=(8, 8), scale=1.05)
    return len(rects) > 0

# --- Model Functions (Modified to use pre-loaded models) ---
def run_yolo_detection(image_path: Path, device: str = "cpu", conf: float = 0.25) -> List[str]:
    # MODIFIED: Use the pre-loaded YOLO_MODEL
    results = YOLO_MODEL.predict(source=str(image_path), device=device, conf=conf, verbose=False)
    if not results or not results[0].boxes:
        return []
    names = YOLO_MODEL.names
    detected_labels = {names.get(int(box.cls[0]), "unknown") for box in results[0].boxes}
    return list(detected_labels)

def run_resnet_classification(image_path: Path, device: str = "cpu", topk: int = 5) -> List[str]:
    # MODIFIED: Use the pre-loaded RESNET tools
    pil_image = Image.open(image_path).convert("RGB")
    input_tensor = RESNET_PREPROCESS(pil_image).unsqueeze(0).to(device)
    with torch.inference_mode():
        logits = RESNET_MODEL(input_tensor)
        probs = torch.nn.functional.softmax(logits, dim=1)[0]
    _, topk_idxs = torch.topk(probs, k=topk)
    return [RESNET_CATEGORIES[idx] for idx in topk_idxs.cpu().numpy()]

# --- Main Analysis Function (from your script, with return statement) ---
def analyze_image_and_categorize(image_path: Path, device: str, category_map: Dict[str, List[Synset]]):
    print(f"\n📸 Processing Image: {image_path.name}")
    detailed_labels = []
    general_categories = set()
    image_bgr = load_image_bgr(image_path)
    run_resnet_as_fallback = False
    
    if detect_faces_and_people(image_bgr):
        print("🧠 Decision: Person/face suspected. Trying YOLO for object detection...")
        yolo_labels = run_yolo_detection(image_path=image_path, device=device)
        print(f"🔎 YOLO Raw Detections: {yolo_labels}")
        if yolo_labels:
            detailed_labels = yolo_labels
            for label in detailed_labels:
                category = get_general_category(label, category_map)
                if category:
                    general_categories.add(category)
        else:
            print("⚠️ YOLO found no objects. Falling back to ResNet.")
            run_resnet_as_fallback = True
    else:
        run_resnet_as_fallback = True

    if run_resnet_as_fallback:
        print("🧠 Decision: Analyzing general scene with ResNet.")
        top_5_labels = run_resnet_classification(image_path=image_path, device=device, topk=5)
        print(f"🕵️  ResNet Raw Predictions: {top_5_labels}")
        if top_5_labels:
            if not detailed_labels:
                detailed_labels.append(top_5_labels[0])
            for label in top_5_labels:
                category = get_general_category(label, category_map)
                if category:
                    general_categories.add(category)
    
    print("\n--- ✅ Analysis Complete ---")
    return {
        "detailed_labels": sorted(list(set(detailed_labels))) if detailed_labels else [],
        "general_categories": sorted(list(general_categories)) if general_categories else [],
    }






# import React, { createContext, useState, useEffect, useCallback } from 'react';

# import { useNavigate } from 'react-router-dom';

# import axiosInstance from '../utils/axiosInstance';



# const AuthContext = createContext();



# export const AuthProvider = ({ children }) => {

#     const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken'));

#     const [user, setUser] = useState(null);

#     const [loading, setLoading] = useState(true);

#     const navigate = useNavigate();



#     const loginUser = useCallback(async (username, password) => {

#         try {

#             const response = await axiosInstance.post('/api/auth/login/', {

#                 username,

#                 password,

#             });

            

#             // The login API only returns the key.

#             if (response.data.key) {

#                 // We set the token, which will trigger the useEffect to fetch the user.

#                 setAuthToken(response.data.key);

#                 localStorage.setItem('authToken', response.data.key);

#             } else {

#                 alert('Login successful, but no auth token was received.');

#             }

#         } catch (error) {

#             console.error("Login failed:", error);

#             alert("Login failed! Please check your username and password.");

#             throw error; 

#         }

#     }, []);



#     const logoutUser = useCallback(() => {

#         setAuthToken(null);

#         setUser(null);

#         localStorage.removeItem('authToken');

#         navigate('/login');

#     }, [navigate]);



#     useEffect(() => {

#         const fetchUserAndRedirect = async () => {

#             if (authToken) {

#                 try {

#                     // This request will now automatically have the correct "Token ..." header

#                     const response = await axiosInstance.get('/api/auth/user/');

#                     setUser(response.data);

#                     // Redirect to homepage AFTER user is fetched successfully

#                     if (window.location.pathname === '/login' || window.location.pathname === '/signup') {

#                         navigate('/');

#                     }

#                 } catch (error) {

#                     console.error("Invalid token, logging out.", error);

#                     logoutUser();

#                 }

#             }

#             setLoading(false);

#         };

#         fetchUserAndRedirect();

#     }, [authToken, logoutUser, navigate]);



#     const contextData = {

#         authToken,

#         user,

#         loading,

#         loginUser,

#         logoutUser,

#     };



#     if (loading) {

#         return <p>Loading...</p>;

#     }



#     return (

#         <AuthContext.Provider value={contextData}>

#             {children}

#         </AuthContext.Provider>

#     );

# };



# export default AuthContext;











# import axios from 'axios';



# const axiosInstance = axios.create();



# axiosInstance.interceptors.request.use(config => {

#     const authToken = localStorage.getItem('authToken');

    

#     if (authToken) {

#         config.headers['Authorization'] = `Token ${authToken}`;

#     }

    

#     return config;

# });



# export default axiosInstance;









# import React, { useState, useContext } from 'react';

# import { Link } from 'react-router-dom';

# import AuthContext from '../context/AuthContext'; // Import the context

# import './AuthForm.css';



# function LoginPage() {

#     const [username, setUsername] = useState('');

#     const [password, setPassword] = useState('');

#     const { loginUser } = useContext(AuthContext); // Get the login function

#     const [isLoading, setIsLoading] = useState(false);



#     const handleSubmit = async (e) => {

#         e.preventDefault();

#         setIsLoading(true);

#         try {

#             await loginUser(username, password);

#         } catch (error) {

#             // Error is handled in the context, but we stop the loading spinner

#             console.error("Login attempt failed.");

#         } finally {

#             setIsLoading(false);

#         }

#     };



#     return (

#         <div className="auth-form-container">

#             <form onSubmit={handleSubmit} className="auth-form">

#                 <h2>Log In</h2>

#                 <div className="form-group">

#                     <label htmlFor="username">Username</label>

#                     <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />

#                 </div>

#                 <div className="form-group">

#                     <label htmlFor="password">Password</label>

#                     <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

#                 </div>

#                 <button type="submit" className="auth-button" disabled={isLoading}>

#                     {isLoading ? "Logging in..." : "Log In"}

#                 </button>

#                 <p className="auth-switch-text">

#                     Don't have an account? <Link to="/signup">Sign Up</Link>

#                 </p>

#             </form>

#         </div>

#     );

# }



# export default LoginPage;
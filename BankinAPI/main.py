from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, date
from typing import List, Optional
import jwt
import hashlib
import uuid
from decimal import Decimal

# Configuration
SECRET_KEY = "votre-secret-key-super-securise"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI(
    title="API Bancaire Simulée",
    description="API de simulation d'un espace client bancaire (CIC, LCL, etc.)",
    version="1.0.0"
)

# Configuration CORS pour permettre les requêtes depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Modèles Pydantic
class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Account(BaseModel):
    id: str
    name: str
    iban: str
    balance: float
    account_type: str
    currency: str = "EUR"

class Transaction(BaseModel):
    id: str
    account_id: str
    date: datetime
    amount: float
    description: str
    category: str
    type: str  # "debit" ou "credit"

class UpcomingDebit(BaseModel):
    id: str
    account_id: str
    scheduled_date: date
    amount: float
    description: str
    beneficiary: str
    is_recurring: bool = False

class UserProfile(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None

# Base de données simulée
fake_users = {
    "client@cic.fr": {
        "id": "user_001",
        "email": "client@cic.fr",
        "password": hashlib.sha256("password123".encode()).hexdigest(),
        "first_name": "Jean",
        "last_name": "Dupont",
        "phone": "+33123456789"
    },
    "marie@lcl.fr": {
        "id": "user_002",
        "email": "marie@lcl.fr",
        "password": hashlib.sha256("motdepasse".encode()).hexdigest(),
        "first_name": "Marie",
        "last_name": "Martin",
        "phone": "+33987654321"
    }
}

fake_accounts = {
    "user_001": [
        {
            "id": "acc_001",
            "name": "Compte Courant",
            "iban": "FR76 1027 8060 4100 0123 4567 890",
            "balance": 2850.75,
            "account_type": "checking",
            "currency": "EUR"
        },
        {
            "id": "acc_002",
            "name": "Livret A",
            "iban": "FR76 1027 8060 4100 0987 6543 210",
            "balance": 15000.00,
            "account_type": "savings",
            "currency": "EUR"
        }
    ],
    "user_002": [
        {
            "id": "acc_003",
            "name": "Compte Courant",
            "iban": "FR14 2004 1010 0505 0001 3M02 606",
            "balance": 1245.30,
            "account_type": "checking",
            "currency": "EUR"
        }
    ]
}

fake_transactions = {
    "acc_001": [
        {
            "id": "tx_001",
            "account_id": "acc_001",
            "date": datetime.now() - timedelta(days=1),
            "amount": -45.50,
            "description": "Courses Carrefour",
            "category": "Alimentation",
            "type": "debit"
        },
        {
            "id": "tx_002",
            "account_id": "acc_001",
            "date": datetime.now() - timedelta(days=2),
            "amount": -890.00,
            "description": "Loyer mensuel",
            "category": "Logement",
            "type": "debit"
        },
        {
            "id": "tx_003",
            "account_id": "acc_001",
            "date": datetime.now() - timedelta(days=3),
            "amount": 2500.00,
            "description": "Salaire",
            "category": "Revenus",
            "type": "credit"
        }
    ],
    "acc_003": [
        {
            "id": "tx_004",
            "account_id": "acc_003",
            "date": datetime.now() - timedelta(days=1),
            "amount": -12.50,
            "description": "Abonnement Netflix",
            "category": "Loisirs",
            "type": "debit"
        }
    ]
}

fake_upcoming_debits = {
    "acc_001": [
        {
            "id": "deb_001",
            "account_id": "acc_001",
            "scheduled_date": date.today() + timedelta(days=5),
            "amount": -890.00,
            "description": "Loyer mensuel",
            "beneficiary": "SCI IMMOBILIER",
            "is_recurring": True
        },
        {
            "id": "deb_002",
            "account_id": "acc_001",
            "scheduled_date": date.today() + timedelta(days=3),
            "amount": -75.20,
            "description": "Facture électricité",
            "beneficiary": "EDF",
            "is_recurring": False
        }
    ],
    "acc_003": [
        {
            "id": "deb_003",
            "account_id": "acc_003",
            "scheduled_date": date.today() + timedelta(days=1),
            "amount": -12.50,
            "description": "Abonnement Netflix",
            "beneficiary": "NETFLIX",
            "is_recurring": True
        }
    ]
}

# Utilitaires
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide"
            )
        user = fake_users.get(email)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utilisateur non trouvé"
            )
        return user
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide"
        )

# Routes d'authentification
@app.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    """Authentification utilisateur"""
    user = fake_users.get(login_data.email)
    if not user or user["password"] != hashlib.sha256(login_data.password.encode()).hexdigest():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Routes utilisateur
@app.get("/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Récupérer le profil utilisateur"""
    return UserProfile(**current_user)

# Routes des comptes
@app.get("/accounts", response_model=List[Account])
async def get_accounts(current_user: dict = Depends(get_current_user)):
    """Récupérer tous les comptes de l'utilisateur"""
    user_accounts = fake_accounts.get(current_user["id"], [])
    return [Account(**account) for account in user_accounts]

@app.get("/accounts/{account_id}", response_model=Account)
async def get_account(account_id: str, current_user: dict = Depends(get_current_user)):
    """Récupérer un compte spécifique"""
    user_accounts = fake_accounts.get(current_user["id"], [])
    account = next((acc for acc in user_accounts if acc["id"] == account_id), None)
    
    if not account:
        raise HTTPException(status_code=404, detail="Compte non trouvé")
    
    return Account(**account)

@app.get("/accounts/{account_id}/balance")
async def get_account_balance(account_id: str, current_user: dict = Depends(get_current_user)):
    """Récupérer le solde d'un compte"""
    user_accounts = fake_accounts.get(current_user["id"], [])
    account = next((acc for acc in user_accounts if acc["id"] == account_id), None)
    
    if not account:
        raise HTTPException(status_code=404, detail="Compte non trouvé")
    
    return {
        "account_id": account_id,
        "balance": account["balance"],
        "currency": account["currency"],
        "last_updated": datetime.now()
    }

# Routes des transactions
@app.get("/accounts/{account_id}/transactions", response_model=List[Transaction])
async def get_transactions(
    account_id: str, 
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Récupérer les transactions d'un compte"""
    user_accounts = fake_accounts.get(current_user["id"], [])
    account = next((acc for acc in user_accounts if acc["id"] == account_id), None)
    
    if not account:
        raise HTTPException(status_code=404, detail="Compte non trouvé")
    
    transactions = fake_transactions.get(account_id, [])
    return [Transaction(**tx) for tx in transactions[:limit]]

# Routes des prélèvements à venir
@app.get("/accounts/{account_id}/upcoming-debits", response_model=List[UpcomingDebit])
async def get_upcoming_debits(
    account_id: str,
    days_ahead: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Récupérer les prélèvements à venir sur un compte"""
    user_accounts = fake_accounts.get(current_user["id"], [])
    account = next((acc for acc in user_accounts if acc["id"] == account_id), None)
    
    if not account:
        raise HTTPException(status_code=404, detail="Compte non trouvé")
    
    upcoming = fake_upcoming_debits.get(account_id, [])
    
    # Filtrer les prélèvements dans les X prochains jours
    cutoff_date = date.today() + timedelta(days=days_ahead)
    filtered_debits = [
        debit for debit in upcoming 
        if datetime.strptime(str(debit["scheduled_date"]), "%Y-%m-%d").date() <= cutoff_date
    ]
    
    return [UpcomingDebit(**debit) for debit in filtered_debits]

@app.get("/upcoming-debits", response_model=List[UpcomingDebit])
async def get_all_upcoming_debits(
    days_ahead: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Récupérer tous les prélèvements à venir pour tous les comptes"""
    user_accounts = fake_accounts.get(current_user["id"], [])
    all_debits = []
    
    cutoff_date = date.today() + timedelta(days=days_ahead)
    
    for account in user_accounts:
        account_debits = fake_upcoming_debits.get(account["id"], [])
        filtered_debits = [
            debit for debit in account_debits 
            if datetime.strptime(str(debit["scheduled_date"]), "%Y-%m-%d").date() <= cutoff_date
        ]
        all_debits.extend(filtered_debits)
    
    return [UpcomingDebit(**debit) for debit in all_debits]

# Route de santé
@app.get("/health")
async def health_check():
    """Vérification de l'état de l'API"""
    return {"status": "ok", "timestamp": datetime.now()}

# Route de test simple pour vérifier que l'API fonctionne
@app.get("/")
async def root():
    """Route racine pour tester l'API"""
    return {"message": "API Bancaire fonctionnelle", "status": "ok"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Lancement de l'API bancaire sur http://localhost:8000")
    print("📖 Documentation disponible sur http://localhost:8000/docs")
    print("🔐 Comptes de test:")
    print("   - client@cic.fr / password123")
    print("   - marie@lcl.fr / motdepasse")
    uvicorn.run(app, host="127.0.0.1", port=8000)
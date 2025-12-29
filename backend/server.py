from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import os
import logging
from pathlib import Path
import jwt
from passlib.context import CryptContext
import httpx
import uuid
from wuzapi import send_whatsapp_message, format_expiring_message

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password: str
    dns_id: str
    name: Optional[str] = None
    phone: Optional[str] = None
    mac_address: Optional[str] = None
    lista_m3u: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    active: bool = True
    pin: str = "0000"
    plan_price: Optional[float] = None
    pay_url: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    dns_id: str
    name: Optional[str] = None
    phone: Optional[str] = None
    mac_address: Optional[str] = None
    expires_at: datetime
    pin: Optional[str] = "0000"
    plan_price: Optional[float] = None
    pay_url: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    dns_id: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    mac_address: Optional[str] = None
    expires_at: Optional[datetime] = None
    active: Optional[bool] = None
    pin: Optional[str] = None
    plan_price: Optional[float] = None
    pay_url: Optional[str] = None

class DNS(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    url: str
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DNSCreate(BaseModel):
    title: str
    url: str
    active: Optional[bool] = True

class DNSUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    active: Optional[bool] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "completed"  # completed, pending, failed
    method: str = "pix"  # pix, card, cash
    notes: Optional[str] = None

class PaymentCreate(BaseModel):
    user_id: str
    amount: float
    status: Optional[str] = "completed"
    method: Optional[str] = "pix"
    notes: Optional[str] = None

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "system_settings"
    whatsapp_support: str = ""
    welcome_message: str = ""
    whatsapp_enabled: bool = False
    whatsapp_url: str = "https://wuzapi.criartebrasil.com.br/api"
    whatsapp_instance: str = ""
    whatsapp_token: str = ""
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SettingsUpdate(BaseModel):
    whatsapp_support: Optional[str] = None
    welcome_message: Optional[str] = None
    whatsapp_enabled: Optional[bool] = None
    whatsapp_url: Optional[str] = None
    whatsapp_instance: Optional[str] = None
    whatsapp_token: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class Stats(BaseModel):
    total_users: int
    active_users: int
    expired_users: int
    total_dns: int
    total_revenue: float
    recent_payments: List[Payment]

# ==================== AUTH HELPERS ====================

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    admin = await db.admins.find_one({"email": email}, {"_id": 0})
    if admin is None:
        raise HTTPException(status_code=401, detail="Admin not found")
    return Admin(**admin)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=Token)
async def register_admin(admin_data: AdminCreate):
    # Check if admin already exists
    existing = await db.admins.find_one({"email": admin_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    admin = Admin(
        email=admin_data.email,
        name=admin_data.name,
        password_hash=get_password_hash(admin_data.password)
    )
    
    doc = admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.admins.insert_one(doc)
    
    access_token = create_access_token(data={"sub": admin.email})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/login", response_model=Token)
async def login_admin(login_data: AdminLogin):
    admin = await db.admins.find_one({"email": login_data.email}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_data.password, admin['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": admin['email']})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me")
async def get_current_admin_info(current_admin: Admin = Depends(get_current_admin)):
    return {"email": current_admin.email, "name": current_admin.name}

# ==================== USER ROUTES ====================

@api_router.get("/users", response_model=List[User])
async def get_users(current_admin: Admin = Depends(get_current_admin)):
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        # Suporte para campo antigo expire_date
        if 'expire_date' in user and 'expires_at' not in user:
            user['expires_at'] = user['expire_date']
        if isinstance(user.get('expires_at'), str):
            user['expires_at'] = datetime.fromisoformat(user['expires_at'])
    return users

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate, current_admin: Admin = Depends(get_current_admin)):
    # Check if username already exists
    existing = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Get DNS to build lista_m3u
    dns = await db.dns_servers.find_one({"id": user_data.dns_id}, {"_id": 0})
    if not dns:
        raise HTTPException(status_code=404, detail="DNS not found")
    
    lista_m3u = f"{dns['url']}/get.php?username={user_data.username}&password={user_data.password}&type=m3u_plus&output=mpegts"
    
    user = User(
        username=user_data.username,
        password=user_data.password,
        dns_id=user_data.dns_id,
        name=user_data.name,
        phone=user_data.phone,
        mac_address=user_data.mac_address,
        expires_at=user_data.expires_at,
        lista_m3u=lista_m3u,
        pin=user_data.pin or "0000",
        plan_price=user_data.plan_price,
        pay_url=user_data.pay_url
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['expires_at'] = doc['expires_at'].isoformat()
    await db.users.insert_one(doc)
    
    return user

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserUpdate, current_admin: Admin = Depends(get_current_admin)):
    existing = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in user_data.model_dump().items() if v is not None}
    
    # Rebuild lista_m3u if username, password, or dns_id changed
    if any(k in update_data for k in ['username', 'password', 'dns_id']):
        dns_id = update_data.get('dns_id', existing['dns_id'])
        username = update_data.get('username', existing['username'])
        password = update_data.get('password', existing['password'])
        
        dns = await db.dns_servers.find_one({"id": dns_id}, {"_id": 0})
        if dns:
            update_data['lista_m3u'] = f"{dns['url']}/get.php?username={username}&password={password}&type=m3u_plus&output=mpegts"
    
    if 'expires_at' in update_data:
        update_data['expires_at'] = update_data['expires_at'].isoformat()
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if isinstance(updated_user.get('created_at'), str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    # Suporte para campo antigo
    if 'expire_date' in updated_user and 'expires_at' not in updated_user:
        updated_user['expires_at'] = updated_user['expire_date']
    if isinstance(updated_user.get('expires_at'), str):
        updated_user['expires_at'] = datetime.fromisoformat(updated_user['expires_at'])
    
    return User(**updated_user)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_admin: Admin = Depends(get_current_admin)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@api_router.post("/users/{user_id}/validate")
async def validate_m3u(user_id: str, current_admin: Admin = Depends(get_current_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get('lista_m3u'):
        raise HTTPException(status_code=400, detail="No M3U list configured")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(user['lista_m3u'])
            if response.status_code == 200:
                return {"valid": True, "message": "M3U list is accessible"}
            else:
                return {"valid": False, "message": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"valid": False, "message": str(e)}

# ==================== DNS ROUTES ====================

@api_router.get("/dns", response_model=List[DNS])
async def get_dns_servers(current_admin: Admin = Depends(get_current_admin)):
    servers = await db.dns_servers.find({}, {"_id": 0}).to_list(1000)
    for server in servers:
        if isinstance(server.get('created_at'), str):
            server['created_at'] = datetime.fromisoformat(server['created_at'])
    return servers

@api_router.post("/dns", response_model=DNS)
async def create_dns(dns_data: DNSCreate, current_admin: Admin = Depends(get_current_admin)):
    dns = DNS(
        title=dns_data.title,
        url=dns_data.url,
        active=dns_data.active
    )
    
    doc = dns.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.dns_servers.insert_one(doc)
    
    return dns

@api_router.put("/dns/{dns_id}", response_model=DNS)
async def update_dns(dns_id: str, dns_data: DNSUpdate, current_admin: Admin = Depends(get_current_admin)):
    existing = await db.dns_servers.find_one({"id": dns_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="DNS not found")
    
    update_data = {k: v for k, v in dns_data.model_dump().items() if v is not None}
    await db.dns_servers.update_one({"id": dns_id}, {"$set": update_data})
    
    updated_dns = await db.dns_servers.find_one({"id": dns_id}, {"_id": 0})
    if isinstance(updated_dns.get('created_at'), str):
        updated_dns['created_at'] = datetime.fromisoformat(updated_dns['created_at'])
    
    return DNS(**updated_dns)

@api_router.delete("/dns/{dns_id}")
async def delete_dns(dns_id: str, current_admin: Admin = Depends(get_current_admin)):
    result = await db.dns_servers.delete_one({"id": dns_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="DNS not found")
    return {"message": "DNS deleted successfully"}

# ==================== PAYMENT ROUTES ====================

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(current_admin: Admin = Depends(get_current_admin)):
    payments = await db.payments.find({}, {"_id": 0}).to_list(1000)
    for payment in payments:
        if isinstance(payment.get('date'), str):
            payment['date'] = datetime.fromisoformat(payment['date'])
    return payments

@api_router.post("/payments", response_model=Payment)
async def create_payment(payment_data: PaymentCreate, current_admin: Admin = Depends(get_current_admin)):
    # Verify user exists
    user = await db.users.find_one({"id": payment_data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    payment = Payment(
        user_id=payment_data.user_id,
        amount=payment_data.amount,
        status=payment_data.status,
        method=payment_data.method,
        notes=payment_data.notes
    )
    
    doc = payment.model_dump()
    doc['date'] = doc['date'].isoformat()
    await db.payments.insert_one(doc)
    
    return payment

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str, current_admin: Admin = Depends(get_current_admin)):
    result = await db.payments.delete_one({"id": payment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Payment deleted successfully"}

# ==================== SETTINGS ROUTES ====================

@api_router.get("/settings", response_model=Settings)
async def get_settings(current_admin: Admin = Depends(get_current_admin)):
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings:
        default_settings = Settings()
        doc = default_settings.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.settings.insert_one(doc)
        return default_settings
    
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    
    # Garantir campos novos
    if 'whatsapp_enabled' not in settings:
        settings['whatsapp_enabled'] = False
    if 'whatsapp_url' not in settings:
        settings['whatsapp_url'] = 'https://wuzapi.criartebrasil.com.br/api'
    if 'whatsapp_instance' not in settings:
        settings['whatsapp_instance'] = ''
    if 'whatsapp_token' not in settings:
        settings['whatsapp_token'] = ''
    
    return Settings(**settings)

# ==================== MESSAGE TEMPLATES ====================

@api_router.get("/templates")
async def get_templates(current_admin: Admin = Depends(get_current_admin)):
    templates = await db.templates.find({}, {"_id": 0}).to_list(100)
    return templates

@api_router.post("/templates")
async def create_template(name: str, message: str, current_admin: Admin = Depends(get_current_admin)):
    template = MessageTemplate(name=name, message=message)
    doc = template.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.templates.insert_one(doc)
    return template

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str, current_admin: Admin = Depends(get_current_admin)):
    await db.templates.delete_one({"id": template_id})
    return {"message": "Template deleted"}

@api_router.get("/whatsapp/qrcode")
async def get_qrcode(current_admin: Admin = Depends(get_current_admin)):
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings or not settings.get('whatsapp_instance'):
        raise HTTPException(status_code=400, detail="WhatsApp not configured")
    
    url = f"{settings['whatsapp_url']}/{settings['whatsapp_instance']}/qrcode"
    headers = {"Token": settings['whatsapp_token']}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, timeout=10.0)
        return response.json()

        return default_settings
    
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    return Settings(**settings)

@api_router.put("/settings", response_model=Settings)
async def update_settings(settings_data: SettingsUpdate, current_admin: Admin = Depends(get_current_admin)):
    update_data = {k: v for k, v in settings_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.settings.update_one(
        {"id": "system_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    updated_settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    if isinstance(updated_settings.get('updated_at'), str):
        updated_settings['updated_at'] = datetime.fromisoformat(updated_settings['updated_at'])
    
    return Settings(**updated_settings)

# ==================== STATS ROUTES ====================

@api_router.get("/stats", response_model=Stats)
async def get_stats(current_admin: Admin = Depends(get_current_admin)):
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"active": True})
    
    # Count expired users
    now = datetime.now(timezone.utc).isoformat()
    expired_users = await db.users.count_documents({"expires_at": {"$lt": now}})
    
    total_dns = await db.dns_servers.count_documents({})
    
    # Calculate total revenue
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.payments.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]['total'] if revenue_result else 0.0
    
    # Get recent payments
    recent_payments = await db.payments.find({}, {"_id": 0}).sort("date", -1).limit(5).to_list(5)
    for payment in recent_payments:
        if isinstance(payment.get('date'), str):
            payment['date'] = datetime.fromisoformat(payment['date'])
    
    return Stats(
        total_users=total_users,
        active_users=active_users,
        expired_users=expired_users,
        total_dns=total_dns,
        total_revenue=total_revenue,
        recent_payments=[Payment(**p) for p in recent_payments]
    )

# ==================== PUBLIC USER PORTAL ====================

@api_router.get("/portal/{username}")
async def get_user_portal(username: str):
    user = await db.users.find_one({"username": username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get DNS info
    dns = await db.dns_servers.find_one({"id": user['dns_id']}, {"_id": 0})
    
    # Get user payments
    payments = await db.payments.find({"user_id": user['id']}, {"_id": 0}).sort("date", -1).to_list(100)
    for payment in payments:
        if isinstance(payment.get('date'), str):
            payment['date'] = datetime.fromisoformat(payment['date'])
    
    # Get settings
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    if 'expire_date' in user and 'expires_at' not in user:
        user['expires_at'] = user['expire_date']
    if isinstance(user.get('expires_at'), str):
        user['expires_at'] = datetime.fromisoformat(user['expires_at'])
    
    return {
        "user": User(**user),
        "dns": DNS(**dns) if dns else None,
        "payments": [Payment(**p) for p in payments],
        "whatsapp_support": settings.get('whatsapp_support', '') if settings else ''
    }

# ==================== WHATSAPP NOTIFICATIONS ====================

class SendWhatsAppRequest(BaseModel):
    user_id: str
    phone: Optional[str] = None
    message: Optional[str] = None

@api_router.post("/notifications/send-whatsapp")
async def send_whatsapp_notification(request: SendWhatsAppRequest, current_admin: Admin = Depends(get_current_admin)):
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings or not settings.get('whatsapp_enabled'):
        raise HTTPException(status_code=400, detail="WhatsApp not configured")
    
    user = await db.users.find_one({"id": request.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    phone = request.phone or settings.get('whatsapp_support')
    if not phone:
        raise HTTPException(status_code=400, detail="Phone required")
    
    message = request.message
    if not message:
        if isinstance(user.get('expires_at'), str):
            user['expires_at'] = datetime.fromisoformat(user['expires_at'])
        expires_at_str = user['expires_at'].strftime('%d/%m/%Y') if user.get('expires_at') else ''
        message = format_expiring_message(
            name=user.get('name', user['username']),
            username=user['username'],
            expires_at=expires_at_str,
            plan_price=user.get('plan_price', 0.0),
            pay_url=user.get('pay_url', ''),
            notes=""
        )
    
    result = await send_whatsapp_message(phone, message, settings)
    return {"success": result["success"]}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
import httpx
from typing import Optional

WUZAPI_URL = "https://wuzapi.criartebrasil.com.br/api"
INSTANCE_ID = "b2b170f60d445656efca18d92edc916d"
TOKEN = "Arte@2025"

async def send_whatsapp_message(phone: str, message: str, settings: dict) -> dict:
    """Envia mensagem WhatsApp via WuzAPI"""
    
    phone_clean = ''.join(filter(str.isdigit, phone))
    if not phone_clean.startswith('55'):
        phone_clean = '55' + phone_clean
    
    url = f"{settings['whatsapp_url']}/{settings['whatsapp_instance']}/messages/text"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url, 
            json={"phone": phone_clean, "message": message},
            headers={"Content-Type": "application/json", "Token": settings['whatsapp_token']},
            timeout=30.0
        )
        return {"success": response.status_code == 200, "status": response.status_code}

def format_expiring_message(name: str, username: str, expires_at: str, plan_price: float, pay_url: str, notes: str = "") -> str:
    """Template mensagem de expiração"""
    
    if not notes:
        notes = "Deixar campo de descrição em branco ou se precisar coloque *SUPORTE TÉCNICO*"
    
    return f"""Olá querido(a) cliente *{name or username}*,

*SUA CONTA EXPIRA EM BREVE!*

Seu plano de *R$ {plan_price:.2f}* vence em:
*{expires_at}*

Seu usuário atual é *{username}*

Evite o bloqueio automático do seu sinal

Para renovar o seu plano agora, clique no link abaixo:
{pay_url}

*Observações:* {notes}

Por favor, nos envie o comprovante de pagamento assim que possível.

É sempre um prazer te atender."""

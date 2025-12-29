# 📝 CHANGELOG - Melhorias ADMTV

## ✅ Concluído - Itens 0 e 1

**Data:** $(date +%Y-%m-%d)

### Backend Atualizado (/app/backend/server.py)

✅ **Campos adicionados em User:**
- `name: Optional[str]` - Nome do usuário (opcional)
- `expires_at: datetime` - Substituiu `expire_date`
- `plan_price: Optional[float]` - Valor do plano
- `pay_url: Optional[str]` - Link de pagamento

✅ **URL M3U corrigida:**
- Formato: `http://dns/get.php?username=X&password=Y&type=m3u_plus&output=mpegts`
- Antes era: `output=ts`

✅ **Compatibilidade retroativa:**
- Suporte a campos antigos `expire_date` → converte para `expires_at`

---

## ⏳ Pendente - Frontend

### Arquivos a atualizar:
1. `/app/frontend/src/pages/Users.js` - Adicionar campos no formulário
2. `/app/frontend/src/pages/Dashboard.js` - Atualizar `expire_date` → `expires_at`
3. `/app/frontend/src/pages/UserPortal.js` - Atualizar `expire_date` → `expires_at`

### Próximo assistente deve:
1. Atualizar formulário Users.js com campos:
   - Nome (opcional)
   - Valor do Plano (opcional)
   - Link de Pagamento (opcional)
2. Mudar todas as referências de `expire_date` para `expires_at`
3. Testar criação/edição de usuários
4. Implementar Item 2 (importar M3U)
5. Implementar Item 4 (WhatsApp - priority!)

---

## 📋 Checklist Completo

Ver arquivo: `/app/CHECKLIST-MELHORIAS.md`

---

**Status Geral:** 🟡 30% concluído
**Créditos gastos:** ~7k tokens

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Unlock, ArrowLeft, Info, Moon, Sun } from 'lucide-react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Fade,
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
} from '@mui/material';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeMode } from '@/theme/ThemeProvider';
import { getApiBase } from '@/lib/api';

const API_URL = getApiBase();

const LOGIN_LEFT_BACKGROUND = '/images/login-left-background.webp';
const LOGIN_REMEMBER_KEY = 'cdt-login-remember-30d';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const EMAIL_LOOKS_VALID = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_FAQ_ITEMS = [
  {
    title: 'Projetos',
    description:
      'Centraliza iniciativas do time com status, prioridade e contexto para facilitar planejamento, acompanhamento e previsibilidade das entregas.',
  },
  {
    title: 'Atividades',
    description:
      'Organiza frentes de trabalho por responsavel, prazo e etapa, permitindo visualizar carga, progresso e dependencias.',
  },
  {
    title: 'Kanban e TO-DOs',
    description:
      'Detalha execucao diaria com cards e checklists, ajudando a manter fluxo continuo, foco e clareza do que precisa ser feito.',
  },
  {
    title: 'Indicadores',
    description:
      'Mostra metricas operacionais e de produtividade para apoiar decisao rapida e identificar gargalos antes de virarem atraso.',
  },
  {
    title: 'Conquistas e Niveis',
    description:
      'Aplica gamificacao com XP, niveis e recompensas para reforcar consistencia, engajamento e evolucao continua do time.',
  },
  {
    title: 'Colaboracao',
    description:
      'Reune comentarios e historico por contexto para melhorar alinhamento entre pessoas, reduzir retrabalho e acelerar resposta.',
  },
  {
    title: 'Organograma e Mapa',
    description:
      'Facilita entendimento da estrutura organizacional e distribuicao de responsabilidades entre areas e pessoas.',
  },
  {
    title: 'Custos',
    description:
      'Permite visao financeira por departamento e iniciativa para conectar execucao tecnica com impacto de negocio.',
  },
] as const;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberFor30d, setRememberFor30d] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSobre, setShowSobre] = useState(false);
  const [firstAccessByHint, setFirstAccessByHint] = useState(false);
  const [hintChecking, setHintChecking] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const { login } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLight = mode === 'light';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOGIN_REMEMBER_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { email?: string; password?: string; expiresAt?: number };
      if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
        localStorage.removeItem(LOGIN_REMEMBER_KEY);
        return;
      }
      setEmail(parsed.email ?? '');
      setPassword(parsed.password ?? '');
      setRememberFor30d(true);
    } catch {
      localStorage.removeItem(LOGIN_REMEMBER_KEY);
    }
  }, []);

  const fetchFirstAccessHint = useCallback(async (em: string) => {
    const normalized = em.trim().toLowerCase();
    if (!normalized || !EMAIL_LOOKS_VALID.test(normalized)) {
      setFirstAccessByHint(false);
      return;
    }
    setHintChecking(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/first-access-hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized }),
      });
      const j = (await res.json().catch(() => ({}))) as { eligible?: boolean };
      const eligible = Boolean(j.eligible);
      setFirstAccessByHint(eligible);
      if (eligible) {
        setPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setError('');
      }
    } catch {
      setFirstAccessByHint(false);
    } finally {
      setHintChecking(false);
    }
  }, []);

  const definePasswordMode = firstAccessByHint;

  const persistRemember = (pwd: string) => {
    if (rememberFor30d) {
      localStorage.setItem(
        LOGIN_REMEMBER_KEY,
        JSON.stringify({
          email,
          password: pwd,
          expiresAt: Date.now() + THIRTY_DAYS_MS,
        }),
      );
    } else {
      localStorage.removeItem(LOGIN_REMEMBER_KEY);
    }
  };

  const canSubmitLogin = Boolean(email.trim() && password);
  const canSubmitDefine =
    Boolean(email.trim() && newPassword && confirmNewPassword) && newPassword === confirmNewPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (definePasswordMode) {
        if (newPassword.length < 8) {
          setError('Use pelo menos 8 caracteres na senha.');
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setError('As senhas não coincidem.');
          return;
        }
        const normalized = email.trim().toLowerCase();
        const res = await fetch(`${API_URL}/api/auth/set-initial-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalized, password: newPassword }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(j.error || 'Não foi possível definir a senha.');
          return;
        }
        await login(email, newPassword);
        persistRemember(newPassword);
        setFirstAccessByHint(false);
        setNewPassword('');
        setConfirmNewPassword('');
        navigate('/');
        return;
      }

      setFirstAccessByHint(false);
      await login(email, password);
      persistRemember(password);
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(message);
      void fetchFirstAccessHint(email);
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <Fade in timeout={280}>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 0.5, letterSpacing: '-0.015em' }}>
          Bem-vindo(a)
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3.5 }}>
          Acesse sua conta para continuar
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFirstAccessByHint(false);
            }}
            onBlur={() => {
              void fetchFirstAccessHint(email);
            }}
            placeholder="seu@email.com"
            required
            disabled={loading}
            autoComplete="username"
            fullWidth
            size="medium"
            slotProps={{
              input: {
                endAdornment: hintChecking ? (
                  <InputAdornment position="end">
                    <CircularProgress color="inherit" size={18} />
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
          {definePasswordMode ? (
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>
                Novo usuário detectado! Defina sua senha abaixo:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Mínimo 8 caracteres. Digite a mesma senha nos dois campos.
              </Typography>
            </Alert>
          ) : null}
          {definePasswordMode ? (
            <>
              <TextField
                label="Nova senha"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="mínimo 8 caracteres"
                required
                disabled={loading}
                autoComplete="new-password"
                fullWidth
                size="medium"
              />
              <TextField
                label="Confirmar senha"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                fullWidth
                size="medium"
              />
            </>
          ) : (
            <TextField
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              autoComplete="current-password"
              fullWidth
              size="medium"
            />
          )}
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 1.5 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || (definePasswordMode ? !canSubmitDefine : !canSubmitLogin)}
            fullWidth
            sx={{ mt: 0.5, height: 44 }}
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : definePasswordMode ? (
                canSubmitDefine ? (
                  <Unlock size={18} strokeWidth={2} />
                ) : (
                  <Lock size={18} strokeWidth={2} />
                )
              ) : canSubmitLogin ? (
                <Unlock size={18} strokeWidth={2} />
              ) : (
                <Lock size={18} strokeWidth={2} />
              )
            }
          >
            {loading
              ? definePasswordMode
                ? 'Salvando...'
                : 'Entrando...'
              : definePasswordMode
                ? 'Definir senha e entrar'
                : 'Acessar sistema'}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.25 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberFor30d}
                  onChange={(e) => setRememberFor30d(e.target.checked)}
                  size="small"
                  disabled={loading}
                />
              }
              label="Manter conectado por 30d"
              sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: 13, color: 'text.secondary' } }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="text"
            size="small"
            startIcon={<Info size={15} />}
            onClick={() => setShowSobre(true)}
            sx={{ color: 'text.secondary', fontSize: 13 }}
          >
            O que é este sistema?
          </Button>
        </Box>
      </Box>
    </Fade>
  );

  const sobreScreen = (
    <Fade in timeout={280}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 780,
          maxHeight: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowLeft size={16} />}
          onClick={() => setShowSobre(false)}
          sx={{ alignSelf: 'flex-start', mb: 3 }}
        >
          Voltar ao login
        </Button>
        <Box
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: { xs: 2, sm: 2.5, md: 3 },
            bgcolor: 'background.paper',
            overflow: 'auto',
            minHeight: 0,
          }}
        >
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1, letterSpacing: '-0.02em' }}>
            Central de Tarefas - Supply
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.75, mb: 2 }}>
            Plataforma para organizar o trabalho do time de desenvolvimento com clareza de prioridade,
            distribuicao de responsabilidades e acompanhamento continuo das entregas.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                O que voce gerencia aqui
              </Typography>
              <Typography component="ul" variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, pl: 2.2, m: 0 }}>
                <li>Projetos, atividades e TO-DOs em fluxo Kanban.</li>
                <li>Responsaveis, prazos, prioridades e acompanhamento diario.</li>
                <li>Historico de comentarios e colaboracao por contexto.</li>
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                Como o sistema apoia o time
              </Typography>
              <Typography component="ul" variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, pl: 2.2, m: 0 }}>
                <li>Indicadores de produtividade e consistencia em tempo real.</li>
                <li>Gamificacao com XP, niveis e conquistas por entrega.</li>
                <li>Visao administrativa com mapa, organograma e custos.</li>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              FAQ rapido das funcionalidades
            </Typography>
            <Box>
              {LOGIN_FAQ_ITEMS.map((item, index) => (
                <Accordion
                  key={item.title}
                  disableGutters
                  elevation={0}
                  sx={{
                    bgcolor: 'transparent',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1.25,
                    mb: 1,
                    '&:before': { display: 'none' },
                    ...(index === LOGIN_FAQ_ITEMS.length - 1 ? { mb: 0 } : {}),
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ChevronDown size={16} />}
                    sx={{ minHeight: 42, '& .MuiAccordionSummary-content': { my: 1 } }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      {item.title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, pb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                      {item.description}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Fade>
  );

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        position: 'relative',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* Painel esquerdo — full altura 50% no desktop; faixa compacta no mobile */}
      <Box
        sx={{
          display: 'flex',
          flex: { xs: '0 0 auto', md: '1 1 50%' },
          width: { xs: '100%', md: '50%' },
          minWidth: { md: 0 },
          flexShrink: 0,
          flexDirection: { xs: 'row', md: 'column' },
          alignItems: 'center',
          justifyContent: { xs: 'space-between', md: 'center' },
          gap: { xs: 1.5, md: 0 },
          minHeight: { xs: 'auto', md: '100vh' },
          background: isLight
            ? 'linear-gradient(145deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)'
            : 'linear-gradient(145deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
          p: { xs: 1.5, sm: 2, md: 6 },
          position: 'relative',
          overflow: 'hidden',
          isolation: 'isolate',
        }}
      >
        {/* Padrão decorativo sutil */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${LOGIN_LEFT_BACKGROUND})`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            opacity: 0.1,
            mixBlendMode: 'soft-light',
            filter: 'grayscale(1) contrast(1.05)',
            pointerEvents: 'none',
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 50%)`,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            textAlign: { xs: 'left', md: 'center' },
            flex: { xs: '1 1 auto', md: 'none' },
            minWidth: 0,
          }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              color: 'white',
              mb: { xs: 0, md: 1.5 },
              letterSpacing: '-0.015em',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.15rem' },
              lineHeight: 1.2,
            }}
          >
            Central de Tarefas - Supply
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.72)',
              maxWidth: { xs: 320, md: 520 },
              mx: { md: 'auto' },
              lineHeight: 1.7,
              display: { xs: 'none', md: 'block' },
              fontSize: { md: '1.03rem' },
            }}
          >
            Plataforma completa para planejar projetos, acompanhar atividades e executar entregas com
            previsibilidade, colaboração em equipe e gamificação orientada a resultados.
          </Typography>
        </Box>

        {/* Chips decorativos */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 0.5, md: 0.9 },
            justifyContent: 'center',
            mt: { xs: 0, md: 4 },
            flexShrink: 0,
            maxWidth: { md: 560 },
            mx: 'auto',
          }}
        >
          {[
            'Projetos',
            'Atividades',
            'Kanban',
            'Indicadores',
            'Conquistas',
            'Colaboração',
            'Organograma',
            'Custos',
          ].map((label) => (
            <Box
              key={label}
              sx={{
                px: { xs: 1, md: 1.5 },
                py: { xs: 0.25, md: 0.5 },
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.2)',
                bgcolor: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.85)',
                fontSize: { xs: 10, md: 11.5 },
                fontWeight: 500,
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              {label}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Painel direito — formulário */}
      <Box
        sx={{
          flex: { xs: '1 1 auto', md: '1 1 50%' },
          width: { md: '50%' },
          minWidth: { md: 0 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: showSobre ? 'flex-start' : { xs: 'flex-start', md: 'center' },
          p: { xs: 3, sm: 5 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Toggle de tema */}
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Tooltip title={isLight ? 'Modo escuro' : 'Modo claro'}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main', borderColor: 'primary.main' },
              }}
            >
              {isLight ? <Moon size={15} /> : <Sun size={15} />}
            </IconButton>
          </Tooltip>
        </Box>

        {showSobre ? sobreScreen : loginForm}
      </Box>
    </Box>
  );
}

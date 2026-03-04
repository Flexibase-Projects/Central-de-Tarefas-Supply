import { Box, Card, CardContent, Typography } from '@mui/material';

const metrics = [
  { label: 'Projetos Ativos', value: '-' },
  { label: 'Tarefas em Andamento', value: '-' },
  { label: 'Próximas Revisões', value: '-' },
  { label: 'Concluídos', value: '-' },
];

export default function Dashboard() {
  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
        {metrics.map((m) => (
          <Card key={m.label} variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {m.label}
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                {m.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

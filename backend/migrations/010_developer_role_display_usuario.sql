-- Renomeia apenas o rótulo do cargo padrão: o código interno (name) permanece 'developer'.
UPDATE cdt_roles
SET display_name = 'Usuário'
WHERE name = 'developer'
   OR display_name = 'Desenvolvedor';

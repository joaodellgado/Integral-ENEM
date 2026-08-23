-- Unifica qualquer questao do banco (nao so as do ENEM 2009) que ainda esteja
-- com disciplina em portugues/literatura/artes para a disciplina unica
-- 'linguagens', alinhado com a nova convencao usada em todo o site
-- (gerar-lista, buscar, calendario, flashcards, simulados, dashboard geral).
UPDATE questions
SET disciplina = 'linguagens'
WHERE disciplina IN ('portugues', 'literatura', 'artes');

-- Atualiza conteudo/tags(topico)/dificuldade das 179 questoes do ENEM 2009
-- com base na classificacao gerada pelo Gemini (questoes/imports/enem_2009_classificacao.json).
-- Disciplina NAO e alterada aqui -- a classificacao de disciplina ja aplicada
-- foi mantida (Gemini divergiu da area oficial do ENEM em 5 das 179 questoes;
-- ver conversa para detalhes).

begin;

UPDATE questions SET conteudo = 'Impactos Ambientais', tags = 'Mudanças climáticas', dificuldade = 'medio' WHERE enunciado = 'A atmosfera terrestre é composta pelos gases nitrogênio (N2) e oxigênio (O2), que somam cerca de 99%, e por gases traços, entre eles o gás carbônico (CO2), vapor de água (H2O), metano (CH4), ozônio (O3) e o óxido nitroso (N2O), que compõem o restante 1% do ar que respiramos. Os gases traços, por serem constituídos por pelo menos três átomos, conseguem absorver o calor irradiado pela Terra, aquecendo o planeta. Esse fenômeno, que acontece  
há bilhões de anos, é chamado de efeito estufa. A partir da Revolução Industrial (século XIX), a concentração de gases traços na atmosfera, em particular o CO2, tem aumentado significativamente, o que resultou no aumento da temperatura em escala global. Mais recentemente, outro fator tornou-se diretamente envolvido no aumento da concentração de CO2 na atmosfera: o desmatamento.

BROWN, I. F.; ALECHANDRE, A. S. Conceitos básicos sobre clima,carbono, florestas e comunidades. A.G. Moreira &amp; S. Schwartzman. As mudanças climáticas globais e os ecossistemas brasileiros. Brasília: Instituto de Pesquisa Ambiental da Amazônia, 2000 (adaptado).';
UPDATE questions SET conteudo = 'Fisiologia humana', tags = 'Sistema digestório', dificuldade = 'facil' WHERE enunciado = 'Analise a figura.

<img src="https://enem.dev/2009/questions/2/7af3247b-4580-4b52-8d5a-b64887db9b0e.png">';
UPDATE questions SET conteudo = 'Fisiologia humana', tags = 'Sistemas imune e linfático', dificuldade = 'medio' WHERE enunciado = 'Estima-se que haja atualmente no mundo 40 milhões de pessoas infectadas pelo HIV (o vírus que causa a AIDS), sendo que as taxas de novas infecções continuam crescendo, principalmente na África, Ásia e Rússia. Nesse cenário de pandemia, uma vacina contra o HIV teria imenso impacto, pois salvaria milhões de vidas. Certamente seria um marco na história planetária e também uma esperança para as populações carentes de tratamento antiviral e de acompanhamento médico.

TANURI, A.; FERREIRA JUNIOR, O. C. Vacina contra Aids: desafios e esperanças. Ciência Hoje (44) 26, 2009 (adaptado).';
UPDATE questions SET conteudo = 'Genética', tags = 'Conceitos em genética', dificuldade = 'medio' WHERE enunciado = 'Em um experimento, preparou-se um conjunto de plantas por técnica de clonagem a partir de uma planta original que apresentava folhas verdes. Esse conjunto foi dividido em dois grupos, que foram tratados de maneira idêntica, com exceção das condições de iluminação, sendo um grupo exposto a ciclos de iluminação solar natural e outro mantido no escuro. Após alguns dias, observou-se que o grupo exposto à luz apresentava folhas verdes como a planta original e o grupo cultivado no escuro apresentava folhas amareladas.';
UPDATE questions SET conteudo = 'Filosofia da Ciência', tags = NULL, dificuldade = 'medio' WHERE enunciado = 'Na linha de uma tradição antiga, o astrônomo grego Ptolomeu (100-170 d.C.) afirmou a tese do geocentrismo, segundo a qual a Terra seria o centro do universo, sendo que o Sol, a Lua e os planetas girariam em seu redor em órbitas circulares. A teoria de Ptolomeu resolvia de modo razoável os problemas astronômicos da sua época. Vários séculos mais tarde, o clérigo e astrônomo polonês Nicolau Copérnico (1473-1543), ao encontrar inexatidões na teoria de Ptolomeu, formulou a teoria do heliocentrismo, segundo a qual o Sol deveria ser considerado o centro do universo, com a Terra, a Lua e os planetas girando circularmente em torno dele. Por fim, o astrônomo e matemático alemão Johannes Kepler (1571- 1630), depois de estudar o planeta Marte por cerca de trinta anos, verificou que a sua órbita é elíptica. Esse resultado generalizou-se para os demais planetas.';
UPDATE questions SET conteudo = 'Ecologia', tags = 'Ciclos biogeoquímicos', dificuldade = 'facil' WHERE enunciado = 'O ciclo biogeoquímico do carbono compreende diversos compartimentos, entre os quais a Terra, a atmosfera e os oceanos, e diversos processos que permitem a transferência de compostos entre esses reservatórios. Os estoques de carbono armazenados na forma de recursos não renováveis, por exemplo, o petróleo, são limitados, sendo de grande relevância que se perceba a importância da substituição de combustíveis fósseis por combustíveis de fontes renováveis.';
UPDATE questions SET conteudo = 'Genética', tags = 'Mutações e engenharia genética', dificuldade = 'facil' WHERE enunciado = 'Um novo método para produzir insulina artificial que utiliza tecnologia de DNA recombinante foi desenvolvido por pesquisadores do Departamento de Biologia Celular da Universidade de Brasília (UnB) em parceria com a iniciativa privada. Os pesquisadores modificaram geneticamente a bactéria Escherichia coli para torná-la capaz de sintetizar o hormônio. O processo permitiu fabricar insulina em maior quantidade e em apenas 30 dias, um terço do tempo necessário para obtê-la pelo método tradicional, que consiste na extração do hormônio a partir do pâncreas de animais abatidos.

Ciência Hoje, 24 abr. 2001. Disponível em: http://cienciahoje.uol.com.br (adaptado).';
UPDATE questions SET conteudo = 'Impactos Ambientais', tags = 'Desmatamento', dificuldade = 'medio' WHERE enunciado = 'A economia moderna depende da disponibilidade de muita energia em diferentes formas, para funcionar e crescer. No Brasil, o consumo total de energia pelas indústrias cresceu mais de quatro vezes no período entre 1970 e 2005. Enquanto os investimentos em energias limpas e renováveis, como solar e eólica, ainda são incipientes, ao se avaliar a possibilidade de instalação de usinas geradoras de energia elétrica, diversos fatores devem ser levados em consideração, tais como os impactos causados ao ambiente e às populações locais.

RICARDO, B.; CAMPANILI, M. <strong>Almanaque Brasil Socioambiental.</strong> São Paulo: Instituto Socioambiental, 2007 (adaptado).';
UPDATE questions SET conteudo = 'Ecologia', tags = 'Biociclos e biomas', dificuldade = 'dificil' WHERE enunciado = 'As mudanças climáticas e da vegetação ocorridas nos trópicos da América do Sul têm sido bem documentadas por diversos autores, existindo um grande acúmulo de evidências geológicas ou paleoclimatológicas que evidenciam essas mudanças ocorridas durante o Quaternário nessa região. Essas mudanças resultaram em restrição da distribuição das florestas pluviais, com expansões concomitantes de habitats não-florestais durante períodos áridos (glaciais), seguido da expansão das florestas pluviais e restrição das áreas não-florestais durante períodos úmidos (interglaciais).

Disponível em: http://zoo.bio.ufpr.br. Acesso em: 1 maio 2009.';
UPDATE questions SET conteudo = 'Citologia', tags = 'Fotossíntese e quimiossíntese', dificuldade = 'facil' WHERE enunciado = 'A fotossíntese é importante para a vida na Terra. Nos cloroplastos dos organismos fotossintetizantes, a energia solar é convertida em energia química que, juntamente com água e gás carbônico (CO2), é utilizada para a síntese de compostos orgânicos (carboidratos). A fotossíntese é o único processo de importância biológica capaz de realizar essa conversão. Todos os organismos, incluindo os produtores, aproveitam a energia armazenada nos carboidratos para impulsionar os processos celulares, liberando CO2 para a atmosfera e água para a célula por meio da respiração celular. Além disso, grande fração dos recursos energéticos do planeta, produzidos tanto no presente (biomassa) como em tempos remotos (combustível fóssil), é resultante da atividade fotossintética.';
UPDATE questions SET conteudo = 'Fisiologia humana', tags = 'Sistema nervoso', dificuldade = 'medio' WHERE enunciado = 'Para que todos os órgãos do corpo humano funcionem em boas condições, é necessário que a temperatura do corpo fique sempre entre 36ºC e 37ºC. Para manter-se dentro dessa faixa, em dias de muito calor ou durante intensos exercícios físicos, uma série de mecanismos fisiológicos é acionada.';
UPDATE questions SET conteudo = 'Equilíbrio químico', tags = NULL, dificuldade = 'dificil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/12/233eafdb-167e-4978-a815-54aad9e6bee2.jpg">

Em solução, os ânions do sabão podem hidrolisar a água e, desse modo, formar o ácido carboxílico correspondente. Por exemplo, para o estearato de sódio, é estabelecido o seguinte equilíbrio:

<img src="https://enem.dev/2009/questions/12/63593c90-04b4-48ea-b9c5-1205f73bef95.jpg">

Uma vez que o ácido carboxílico formado é pouco solúvel em água e menos eficiente na remoção de gorduras, o pH do meio deve ser controlado de maneira a evitar que o equilíbrio acima seja deslocado para a direita.';
UPDATE questions SET conteudo = 'Impactos Ambientais', tags = NULL, dificuldade = 'medio' WHERE enunciado = 'A abertura e a pavimentação de rodovias em zonas rurais e regiões afastadas dos centros urbanos, por um lado, possibilita melhor acesso e maior integração entre as comunidades, contribuindo com o desenvolvimento social e urbano de populações isoladas. Por outro lado, a construção de rodovias pode trazer impactos indesejáveis ao meio ambiente, visto que a abertura de estradas pode resultar na fragmentação de habitats, comprometendo o fluxo gênico e as interações entre espécies silvestres, além de prejudicar o fluxo natural de rios e riachos, possibilitar o ingresso de espécies exóticas em ambientes naturais e aumentar a pressão antrópica sobre os ecossistemas nativos.

BARBOSA, N. P. U.; FERNANDES, G. W. A destruição do jardim. <strong>Scientific American</strong> <strong>Brasil.</strong> Ano 7, número 80, dez. 2008 (adaptado).';
UPDATE questions SET conteudo = 'Eletrodinâmica', tags = 'Potência elétrica', dificuldade = 'medio' WHERE enunciado = '<img src="https://enem.dev/2009/questions/14/524ed514-1e24-42fe-9a5f-efebf0ce3c6d.png">';
UPDATE questions SET conteudo = 'Eletroquímica', tags = 'Eletrólise', dificuldade = 'dificil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/15/a4e6a5bb-5a91-4e8a-86f2-b4775c56178f.jpg">';
UPDATE questions SET conteudo = 'Citologia', tags = 'Síntese de proteínas', dificuldade = 'dificil' WHERE enunciado = 'A figura seguinte representa um modelo de transmissão da informação genética nos sistemas biológicos. No fim do processo, que inclui a replicação, a transcrição e a tradução, há três formas proteicas diferentes denominadas a, b e c.

<img src="https://enem.dev/2009/questions/16/2c67a1f7-b788-445d-9a6c-ef9d499ff78b.png">';
UPDATE questions SET conteudo = 'Mecânica', tags = 'Movimento circular uniforme', dificuldade = 'dificil' WHERE enunciado = 'O Brasil pode se transformar no primeiro país das Américas a entrar no seleto grupo das nações que dispõem de trens-bala. O Ministério dos Transportes prevê o lançamento do edital de licitação internacional para a construção da ferrovia de alta velocidade Rio-São Paulo. A viagem ligará os 403 quilômetros entre a Central do Brasil, no Rio, e a Estação da Luz, no centro da capital paulista, em uma hora e 25 minutos.

Disponível em: http://oglobo.globo.com. Acesso em: 14 jul. 2009';
UPDATE questions SET conteudo = 'Termologia', tags = 'Calorimetria', dificuldade = 'medio' WHERE enunciado = '<img src="https://enem.dev/2009/questions/18/984c1d41-ccbd-4532-b8aa-b39dfefb0649.png">';
UPDATE questions SET conteudo = 'Eletrodinâmica', tags = 'Potência elétrica', dificuldade = 'facil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/19/ce14eccd-b5dd-4dde-a5a6-2e163d72fec9.png">

A escolha das lâmpadas é essencial para obtenção de uma boa iluminação. A potência da lâmpada deverá estar de acordo com o tamanho do cômodo a ser iluminado. O quadro a seguir mostra a relação entre as áreas dos cômodos (em m²) e as potências das lâmpadas (em W), e foi utilizado como referência para o primeiro pavimento de uma residência.

<img src="https://enem.dev/2009/questions/19/9747c953-2a43-411f-b7ee-49a4e4fd6429.png">';
UPDATE questions SET conteudo = 'Termologia', tags = 'Leis da termodinâmica', dificuldade = 'medio' WHERE enunciado = '<img src="https://enem.dev/2009/questions/20/a5b76cbb-b0e8-42a4-ba0f-ca81b7abdcb7.png">';
UPDATE questions SET conteudo = 'Citologia', tags = 'Gametogênese e fecundação', dificuldade = 'medio' WHERE enunciado = 'Os seres vivos apresentam diferentes ciclos de vida, caracterizados pelas fases nas quais gametas são produzidos e pelos processos reprodutivos que resultam na geração de novos indivíduos.';
UPDATE questions SET conteudo = 'Eletrodinâmica', tags = 'Corrente elétrica e leis de Ohm', dificuldade = 'medio' WHERE enunciado = 'Um medicamento, após ser ingerido, atinge a corrente sanguínea e espalha-se pelo organismo, mas, como suas moléculas “não sabem” onde é que está o problema, podem atuar em locais diferentes do local “alvo” e desencadear efeitos além daqueles desejados. Não seria perfeito se as moléculas dos medicamentos soubessem exatamente onde está o problema e fossem apenas até aquele local exercer sua ação? A técnica conhecida como iontoforese, indolor e não invasiva, promete isso. Como mostram as figuras, essa nova técnica baseia-se na aplicação de uma corrente elétrica de baixa intensidade sobre a pele do paciente, permitindo que fármacos permeiem membranas biológicas e alcancem a corrente sanguínea, sem passar pelo estômago. Muitos pacientes relatam apenas um formigamento no local de aplicação. O objetivo da corrente elétrica é formar poros que permitam a passagem do fármaco de interesse. A corrente elétrica é distribuída por eletrodos, positivo e negativo, por meio de uma solução aplicada sobre a pele. Se a molécula do medicamento tiver carga elétrica positiva ou negativa, ao entrar em contato com o eletrodo de carga de mesmo sinal, ela será repelida e forçada a entrar na pele (eletrorrepulsão – A). Se for neutra, a molécula será forçada a entrar na pele juntamente com o fluxo de solvente fisiológico que se forma entre os eletrodos (eletrosmose – B).

<img src="https://enem.dev/2009/questions/22/5109eb3c-8a36-48f7-a9e5-b71fcc02ec6d.png">';
UPDATE questions SET conteudo = 'Impactos Ambientais', tags = 'Poluição', dificuldade = 'facil' WHERE enunciado = 'Cerca de 1% do lixo urbano é constituído por resíduos sólidos contendo elementos tóxicos. Entre esses elementos estão metais pesados como o cádmio, o chumbo e o mercúrio, componentes de pilhas e baterias, que são perigosos à saúde humana e ao meio ambiente. Quando descartadas em lixos comuns, pilhas e baterias vão para aterros sanitários ou lixões a céu aberto, e o vazamento de seus componentes contamina o solo, os rios e o lençol freático, atingindo a flora e a fauna. Por serem bioacumulativos e não biodegradáveis, esses metais chegam de forma acumulada aos seres humanos, por meio da cadeia alimentar. A legislação vigente (Resolução CONAMA no 257/1999) regulamenta o destino de pilhas e baterias após seu esgotamento energético e determina aos fabricantes e/ou importadores a quantidade máxima permitida desses metais em cada tipo de pilha/bateria, porém o problema ainda persiste.

Disponível em: http://www.mma.gov.br.  
Acesso em: 11 jul. 2009 (adaptado).';
UPDATE questions SET conteudo = 'Climatologia', tags = 'Fatores do clima', dificuldade = 'medio' WHERE enunciado = 'Umidade relativa do ar é o termo usado para descrever a quantidade de vapor de água contido na atmosfera. Ela é definida pela razão entre o conteúdo real de umidade de uma parcela de ar e a quantidade de umidade que a mesma parcela de ar pode armazenar na mesma temperatura e pressão quando está saturada de vapor, isto é, com 100% de umidade relativa. O gráfico representa a relação entre a umidade relativa do ar e sua temperatura ao longo de um período de 24 horas em um determinado local.

<img src="https://enem.dev/2009/questions/24/53ebbcea-15f9-494b-9426-72808957e3f9.jpg">';
UPDATE questions SET conteudo = 'Probabilidade', tags = 'Probabilidade condicional e distribuição binomial', dificuldade = 'dificil' WHERE enunciado = 'Os planos de controle e erradicação de doenças em animais envolvem ações de profilaxia e dependem em grande medida da correta utilização e interpretação de testes diagnósticos. O quadro mostra um exemplo hipotético de aplicação de um teste diagnóstico.

<img src="https://enem.dev/2009/questions/25/404c9597-0e69-4df3-b423-1e332c80add4.jpg">';
UPDATE questions SET conteudo = 'Química Inorgânica', tags = 'Ácidos', dificuldade = 'medio' WHERE enunciado = 'O processo de industrialização tem gerado sérios problemas de ordem ambiental, econômica e social, entre os quais se pode citar a chuva ácida. Os ácidos usualmente presentes em maiores proporções na água da chuva são o H2CO3, formado pela reação do CO2 atmosférico com a água, o HNO3 , o HNO2 , o H2SO4 e o H2SO3 . Esses quatro últimos são formados principalmente a partir da reação da água com os óxidos de nitrogênio e de enxofre gerados pela queima de combustíveis fósseis.';
UPDATE questions SET conteudo = 'Mecânica', tags = 'Gravitação universal', dificuldade = 'dificil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/27/8a0ca647-a136-470c-b4b1-f7cd0de48513.png">';
UPDATE questions SET conteudo = 'Ecologia', tags = 'Sucessão ecológica e zonação', dificuldade = 'medio' WHERE enunciado = 'Uma pesquisadora deseja reflorestar uma área de mata ciliar quase que totalmente desmatada. Essa formação vegetal é um tipo de floresta muito comum nas margens de rios dos cerrados no Brasil central e, em seu clímax, possui vegetação arbórea perene e apresenta dossel fechado, com pouca incidência luminosa no solo e nas plântulas. Sabe-se que a incidência de luz, a disponibilidade de nutrientes e a umidade do solo são os principais fatores do meio ambiente físico que influenciam no desenvolvimento da planta. Para testar unicamente os efeitos da variação de luz, a pesquisadora analisou, em casas de vegetação com condições controladas, o desenvolvimento de plantas de 10 espécies nativas da região desmatada sob quatro condições de luminosidade: uma sob sol pleno e as demais em diferentes níveis de sombreamento. Para cada tratamento experimental, a pesquisadora relatou se o desenvolvimento da planta foi bom, razoável ou ruim, de acordo com critérios específicos. Os resultados obtidos foram os seguintes:

<img src="https://enem.dev/2009/questions/28/d003c721-13f1-4ef4-8cca-6b37a1312ee3.png">';
UPDATE questions SET conteudo = 'Atomística', tags = 'Propriedades atômicas', dificuldade = 'medio' WHERE enunciado = '<img src="https://enem.dev/2009/questions/29/8b64e737-d832-4707-9ffe-9eb28b3f7b1c.jpg">';
UPDATE questions SET conteudo = 'Termologia', tags = 'Calorimetria', dificuldade = 'dificil' WHERE enunciado = 'É possível, com 1 litro de gasolina, usando todo o calor produzido por sua combustão direta, aquecer 200 litros de água de 20 °C a 55 °C. Pode-se efetuar esse mesmo aquecimento por um gerador de eletricidade, que consome 1 litro de gasolina por hora e fornece 110 V a um resistor de 11 Ω, imerso na água, durante um certo intervalo de tempo. Todo o calor liberado pelo resistor é transferido à água.';
UPDATE questions SET conteudo = 'Ondulatória', tags = 'Espectro eletromagnético', dificuldade = 'dificil' WHERE enunciado = 'O progresso da tecnologia introduziu diversos artefatos geradores de campos eletromagnéticos. Uma das mais empregadas invenções nessa área são os telefones celulares e smartphones. As tecnologias de transmissão de celular atualmente em uso no Brasil contemplam dois sistemas. O primeiro deles é operado entre as frequências de 800 MHz e 900 MHz e constitui os chamados sistemas TDMA/CDMA. Já a tecnologia GSM, ocupa a frequência de 1.800 MHz.';
UPDATE questions SET conteudo = 'Física moderna', tags = 'Aspectos gerais em física moderna', dificuldade = 'medio' WHERE enunciado = '<img src="https://enem.dev/2009/questions/32/2f78c8cf-ff4d-40a1-ad8a-fd513f7001c3.png">';
UPDATE questions SET conteudo = 'Origem da vida e evolução', tags = 'Evolução', dificuldade = 'facil' WHERE enunciado = 'Os ratos <em>Peromyscus polionotus</em> encontram-se distribuídos em ampla região na América do Norte. A pelagem de ratos dessa espécie varia do marrom claro até o escuro, sendo que os ratos de uma mesma população têm coloração muito semelhante. Em geral, a coloração da pelagem também é muito parecida à cor do solo da região em que se encontram, que também apresenta a mesma variação de cor, distribuída ao longo de um gradiente sul-norte. Na figura, encontram-se representadas sete diferentes populações de <em>P. polionotus</em>. Cada população é representada pela pelagem do rato, por uma amostra de solo e por sua posição geográfica no mapa.

<img src="https://enem.dev/2009/questions/33/a2e94298-0c01-4a34-9c5e-938a893089c7.png">';
UPDATE questions SET conteudo = 'Ecologia', tags = NULL, dificuldade = 'facil' WHERE enunciado = 'O lixo orgânico de casa – constituído de restos de verduras, frutas, legumes, cascas de ovo, aparas de grama, entre outros –, se for depositado nos lixões, pode contribuir para o aparecimento de animais e de odores indesejáveis. Entretanto, sua reciclagem gera um excelente adubo orgânico, que pode ser usado no cultivo de hortaliças, frutíferas e plantas ornamentais. A produção do adubo ou composto orgânico se dá por meio da compostagem, um processo simples que requer alguns cuidados especiais. O material que é acumulado diariamente em recipientes próprios deve ser revirado com auxílio de ferramentas adequadas, semanalmente, de forma a homogeneizá-lo. É preciso também umedecê-lo periodicamente. O material de restos de capina pode ser intercalado entre uma camada e outra de lixo da cozinha. Por meio desse método, o adubo orgânico estará pronto em aproximadamente dois a três meses.

Como usar o lixo orgânico em casa? Ciência Hoje, v. 42, jun. 2008 (adaptado).';
UPDATE questions SET conteudo = 'Termologia', tags = 'Calorimetria', dificuldade = 'dificil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/35/9d8b484b-e10a-414e-9a44-bd803c5169f6.png">';
UPDATE questions SET conteudo = 'Química orgânica', tags = 'Compostos orgânicos', dificuldade = 'dificil' WHERE enunciado = 'O uso de protetores solares em situações de grande exposição aos raios solares como, por exemplo, nas praias, é de grande importância para a saúde. As moléculas ativas de um protetor apresentam, usualmente, anéis aromáticos conjugados com grupos carbonila, pois esses sistemas são capazes de absorver a radiação ultravioleta mais nociva aos seres humanos. A conjugação é definida como a ocorrência de alternância entre ligações simples e duplas em uma molécula. Outra propriedade das moléculas em questão é apresentar, em uma de suas extremidades, uma parte apolar responsável por reduzir a solubilidade do composto em água, o que impede sua rápida remoção quando do contato com a água.';
UPDATE questions SET conteudo = 'Fisiologia humana', tags = 'Órgãos dos sentidos', dificuldade = 'medio' WHERE enunciado = 'Sabe-se que o olho humano não consegue diferenciar componentes de cores e vê apenas a cor resultante, diferentemente do ouvido, que consegue distinguir, por exemplo, dois instrumentos diferentes tocados simultaneamente. Os raios luminosos do espectro visível, que têm comprimento de onda entre 380 nm e 780 nm, incidem na córnea, passam pelo cristalino e são projetados na retina. Na retina, encontram-se dois tipos de fotorreceptores, os cones e os bastonetes, que convertem a cor e a intensidade da luz recebida em impulsos nervosos. Os cones distinguem as cores primárias: vermelho, verde e azul, e os bastonetes diferenciam apenas níveis de intensidade, sem separar comprimentos de onda. Os impulsos nervosos produzidos são enviados ao cérebro por meio do nervo óptico, para que se dê a percepção da imagem.';
UPDATE questions SET conteudo = 'Termologia', tags = 'Dilatometria', dificuldade = 'dificil' WHERE enunciado = 'Durante uma ação de fiscalização em postos de combustíveis, foi encontrado um mecanismo inusitado para enganar o consumidor. Durante o inverno, o responsável por um posto de combustível compra álcool por R$ 0,50/litro, a uma temperatura de 5 °C. Para revender o líquido aos motoristas, instalou um mecanismo na bomba de combustível para aquecê-lo, para que atinja a temperatura de 35 °C, sendo o litro de álcool revendido a R$ 1,60. Diariamente o posto compra 20 mil litros de álcool a 5 ºC e os revende.';
UPDATE questions SET conteudo = 'Termologia', tags = 'Leis da termodinâmica', dificuldade = 'medio' WHERE enunciado = 'A invenção da geladeira proporcionou uma revolução no aproveitamento dos alimentos, ao permitir que fossem armazenados e transportados por longos períodos. A figura apresentada ilustra o processo cíclico de funcionamento de uma geladeira, em que um gás no interior de uma tubulação é forçado a circular entre o congelador e a parte externa da geladeira. É por meio dos processos de compressão, que ocorre na parte externa, e de expansão, que ocorre na parte interna, que o gás proporciona a troca de calor entre o interior e o exterior da geladeira.

Disponível em: http://home.howstuffworks.com. Acesso em: 19 out. 2008 (adaptado).

<img src="https://enem.dev/2009/questions/39/6991cb0b-0677-4966-9b10-126fa676fe93.png">';
UPDATE questions SET conteudo = 'Citologia', tags = 'Transporte em membrana', dificuldade = 'medio' WHERE enunciado = 'Na manipulação em escala nanométrica, os átomos revelam características peculiares, podendo apresentar tolerância à temperatura, reatividade química, condutividade elétrica, ou mesmo exibir força de intensidade extraordinária. Essas características explicam o interesse industrial pelos nanomateriais que estão sendo muito pesquisados em diversas áreas, desde o desenvolvimento de cosméticos, tintas e tecidos, até o de terapias contra o câncer.

LACAVA, Z. G. M; MORAIS, P. C. Nanobiotecnologia e Saúde. Disponível em: http://www.comciencia.br (adaptado).';
UPDATE questions SET conteudo = 'Genética', tags = 'Conceitos em genética', dificuldade = 'medio' WHERE enunciado = 'Uma vítima de acidente de carro foi encontrada carbonizada devido a uma explosão. Indícios, como certos adereços de metal usados pela vítima, sugerem que a mesma seja filha de um determinado casal. Uma equipe policial de perícia teve acesso ao material biológico carbonizado da vítima, reduzido, praticamente, a fragmentos de ossos. Sabe-se que é possível obter DNA em condições para análise genética de parte do tecido interno de ossos. Os peritos necessitam escolher, entre cromossomos autossômicos, cromossomos sexuais (X e Y) ou DNAmt (DNA mitocondrial), a melhor opção para identificação do parentesco da vítima com o referido casal. Sabe-se que, entre outros aspectos, o número de cópias de um mesmo cromossomo por célula maximiza a chance de se obter moléculas não degradadas pelo calor da explosão.';
UPDATE questions SET conteudo = 'Ecologia', tags = 'Desequilíbrios ecológicos', dificuldade = 'medio' WHERE enunciado = 'O cultivo de camarões de água salgada vem se desenvolvendo muito nos últimos anos na região Nordeste do Brasil e, em algumas localidades, passou a ser a principal atividade econômica. Uma das grandes preocupações dos impactos negativos dessa atividade está relacionada à descarga, sem nenhum tipo de tratamento, dos efluentes dos viveiros diretamente no ambiente marinho, em estuários ou em manguezais. Esses efluentes possuem matéria orgânica particulada e dissolvida, amônia, nitrito, nitrato, fosfatos, partículas de sólidos em suspensão e outras substâncias que podem ser consideradas contaminantes potenciais.

CASTRO, C. B.; ARAGÃO, J. S.; COSTA-LOTUFO, L. V. Monitoramento da toxicidade de efluentes de uma fazenda de cultivo de camarão marinho. Anais do IX Congresso Brasileiro de Ecotoxicologia, 2006 (adaptado).';
UPDATE questions SET conteudo = 'Termoquímica', tags = 'Equações termoquímicas', dificuldade = 'dificil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/43/fc15f9d3-d27d-4451-86aa-2d9576a0e88f.jpg">';
UPDATE questions SET conteudo = 'Soluções', tags = 'Concentração', dificuldade = 'dificil' WHERE enunciado = 'O álcool hidratado utilizado como combustível veicular é obtido por meio da destilação fracionada de soluções aquosas geradas a partir da fermentação de biomassa. Durante a destilação, o teor de etanol da mistura é aumentado, até o limite de 96% em massa.';
UPDATE questions SET conteudo = 'Eletrodinâmica', tags = 'Circuitos elétricos', dificuldade = 'medio' WHERE enunciado = '<img src="https://enem.dev/2009/questions/45/391df735-013e-414c-a12f-3d626c8855ce.png">';
UPDATE questions SET conteudo = 'Idade Antiga', tags = 'Egito', dificuldade = 'facil' WHERE enunciado = 'O Egito é visitado anualmente por milhões de turistas de todos os quadrantes do planeta, desejosos de ver com os próprios olhos a grandiosidade do poder esculpida em pedra há milênios: as pirâmides de Gizeh, as tumbas do Vale dos Reis e os numerosos templos construídos ao longo do Nilo.';
UPDATE questions SET conteudo = 'Idade Moderna', tags = 'Estados Nacionais', dificuldade = 'facil' WHERE enunciado = 'O que se entende por Corte do antigo regime é, em primeiro lugar, a casa de habitação dos reis de França, de suas famílias, de todas as pessoas que, de perto ou de longe, dela fazem parte. As despesas da Corte, da imensa casa dos reis, são consignadas no registro das despesas do reino da França sob a rubrica significativa de Casas Reais.

ELIAS, N. A sociedade de corte. Lisboa: Estampa, 1987';
UPDATE questions SET conteudo = 'Brasil Colônia', tags = NULL, dificuldade = 'medio' WHERE enunciado = 'Hoje em dia, nas grandes cidades, enterrar os mortos é uma prática quase íntima, que diz respeito apenas à família. A menos, é claro, que se trate de uma personalidade conhecida. Entretanto, isso nem sempre foi assim. Para um historiador, os sepultamentos são uma fonte de informações importantes para que se compreenda, por exemplo, a vida política das sociedades.';
UPDATE questions SET conteudo = 'Idade Contemporânea', tags = 'Nazifascismo', dificuldade = 'dificil' WHERE enunciado = 'A Idade Média é um extenso período da História do Ocidente cuja memória é construída e reconstruída segundo as circunstâncias das épocas posteriores. Assim, desde o Renascimento, esse período vem sendo alvo de diversas interpretações que dizem mais sobre o contexto histórico em que são produzidas do que propriamente sobre o Medievo.';
UPDATE questions SET conteudo = 'Idade Contemporânea', tags = 'Entreguerras', dificuldade = 'medio' WHERE enunciado = 'A primeira metade do século XX foi marcada por conflitos e processos que a inscreveram como um dos mais violentos períodos da história humana.';
UPDATE questions SET conteudo = 'Idade Contemporânea', tags = 'Nazifascismo', dificuldade = 'medio' WHERE enunciado = 'Os regimes totalitários da primeira metade do século XX apoiaram-se fortemente na mobilização da juventude em torno da defesa de ideias grandiosas para o futuro da nação. Nesses projetos, os jovens deveriam entender que só havia uma pessoa digna de ser amada e obedecida, que era o líder. Tais movimentos sociais juvenis contribuíram para a implantação e a sustentação do nazismo, na Alemanha, e do fascismo, na Itália, Espanha e Portugal.';
UPDATE questions SET conteudo = 'Idade Contemporânea', tags = 'Guerra Fria', dificuldade = 'facil' WHERE enunciado = 'Do ponto de vista geopolítico, a Guerra Fria dividiu a Europa em dois blocos. Essa divisão propiciou a formação de alianças antagônicas de caráter militar, como a OTAN, que aglutinava os países do bloco ocidental, e o Pacto de Varsóvia, que concentrava os do bloco oriental. É importante destacar que, na formação da OTAN, estão presentes, além dos países do oeste europeu, os EUA e o Canadá. Essa divisão histórica atingiu igualmente os âmbitos político e econômico que se refletia pela opção entre os modelos capitalista e socialista.';
UPDATE questions SET conteudo = 'Movimentos Sociais', tags = NULL, dificuldade = 'medio' WHERE enunciado = 'O ano de 1968 ficou conhecido pela efervescência social, tal como se pode comprovar pelo seguinte trecho, retirado de texto sobre propostas preliminares para uma revolução cultural: “É preciso discutir em todos os lugares e com todos. O dever de ser responsável e pensar politicamente diz respeito a todos, não é privilégio de uma minoria de iniciados. Não devemos nos surpreender com o caos das ideias, pois essa é a condição para a emergência de novas ideias. Os pais do regime devem compreender que autonomia não é uma palavra vã; ela supõe a partilha do poder, ou seja, a mudança de sua natureza. Que ninguém tente rotular o movimento atual; ele não tem etiquetas e não precisa delas”.

Journal de la comune étudiante. Textes et documents. Paris: Seuil, 1969 (adaptado)';
UPDATE questions SET conteudo = 'Cultura e Identidade', tags = NULL, dificuldade = 'facil' WHERE enunciado = 'Os Yanomami constituem uma sociedade indígena do norte da Amazônia e formam um amplo conjunto linguístico e cultural. Para os Yanomami, urihi, a “terrafloresta”, não é um mero cenário inerte, objeto de exploração econômica, e sim uma entidade viva, animada por uma dinâmica de trocas entre os diversos seres que a povoam. A floresta possui um sopro vital, wixia, que é muito longo. Se não a desmatarmos, ela não morrerá. Ela não se decompõe, isto é, não se desfaz. É graças ao seu sopro úmido que as plantas crescem. A floresta não está morta pois, se fosse assim, as florestas não teriam folhas. Tampouco se veria água. Segundo os Yanomami, se os brancos os fizerem desaparecer para desmatá-la e morar no seu lugar, ficarão pobres e acabarão tendo fome e sede.

ALBERT, B. Yanomami, o espírito da floresta. <strong>Almanaque Brasil Socioambiental.</strong> São Paulo: ISA, 2007 (adaptado).';
UPDATE questions SET conteudo = 'Idade Contemporânea', tags = 'Guerra Fria', dificuldade = 'medio' WHERE enunciado = 'O fim da Guerra Fria e da bipolaridade, entre as décadas de 1980 e 1990, gerou expectativas de que seria instaurada uma ordem internacional marcada pela redução de conflitos e pela multipolaridade. O panorama estratégico do mundo pós-Guerra Fria apresenta';
UPDATE questions SET conteudo = 'Filosofia Moderna', tags = 'Contratualismo', dificuldade = 'dificil' WHERE enunciado = 'Na democracia estado-unidense, os cidadãos são incluídos na sociedade pelo exercício pleno dos direitos políticos e também pela ideia geral de direito de propriedade. Compete ao governo garantir que esse direito não seja violado. Como consequência, mesmo aqueles que possuem uma pequena propriedade sentem-se cidadãos de pleno direito.';
UPDATE questions SET conteudo = 'Sociólogos Clássicos', tags = NULL, dificuldade = 'dificil' WHERE enunciado = 'Na década de 30 do século XIX, Tocqueville escreveu as seguintes linhas a respeito da moralidade nos EUA: “A opinião pública norte-americana é particularmente dura com a falta de moral, pois esta desvia a atenção frente à busca do bem-estar e prejudica a harmonia doméstica, que é tão essencial ao sucesso dos negócios. Nesse sentido, pode-se dizer que ser casto é uma questão de honra”.

TOCQUEVILLE, A. Democracy in America. Chicago: Encyclopædia Britannica, Inc., Great Books 44, 1990 (adaptado).';
UPDATE questions SET conteudo = 'Filosofia Clássica', tags = 'Aristóteles', dificuldade = 'medio' WHERE enunciado = 'Segundo Aristóteles, “na cidade com o melhor conjunto de normas e naquela dotada de homens absolutamente justos, os cidadãos não devem viver uma vida de trabalho trivial ou de negócios — esses tipos de vida são desprezíveis e incompatíveis com as qualidades morais —, tampouco devem ser agricultores os aspirantes à cidadania, pois o lazer é indispensável ao desenvolvimento das qualidades morais e à prática das atividades políticas”.

VAN ACKER, T. <em>Grécia. A vida cotidiana na cidade-Estado</em>. São Paulo: Atual, 1994.';
UPDATE questions SET conteudo = 'Sociologia Brasileira', tags = NULL, dificuldade = 'dificil' WHERE enunciado = 'Para Caio Prado Jr., a formação brasileira se completaria no momento em que fosse superada a nossa herança de inorganicidade social ― o oposto da interligação com objetivos internos ― trazida da colônia. Este momento alto estaria, ou esteve, no futuro. Se passarmos a Sérgio Buarque de Holanda, encontraremos algo análogo. O país será moderno e estará formado quando superar a sua herança portuguesa, rural e autoritária, quando então teríamos um país democrático. Também aqui o ponto de chegada está mais adiante, na dependência das decisões do presente. Celso Furtado, por seu turno, dirá que a nação não se completa enquanto as alavancas do comando, principalmente do econômico, não passarem para dentro do país. Como para os outros dois, a conclusão do processo encontra-se no futuro, que agora parece remoto.

SCHWARZ, R. Os sete fôlegos de um livro. Sequências brasileiras. São Paulo: Cia. das Letras,1999 (adaptado).';
UPDATE questions SET conteudo = 'Brasil República', tags = 'Constituição Federal', dificuldade = 'facil' WHERE enunciado = 'A definição de eleitor foi tema de artigos nas Constituições brasileiras de 1891 e de 1934. Diz a Constituição da República dos Estados Unidos do Brasil de 1891:

Art. 70. São eleitores os cidadãos maiores de 21 anos que se alistarem na forma da lei.

A Constituição da República dos Estados Unidos do Brasil de 1934, por sua vez, estabelece que:

Art. 180. São eleitores os brasileiros de um e de outro sexo, maiores de 18 anos, que se alistarem na forma da lei.';
UPDATE questions SET conteudo = 'Brasil República', tags = 'Era Vargas', dificuldade = 'medio' WHERE enunciado = 'O autor da constituição de 1937, Francisco Campos, afirma no seu livro, O Estado Nacional, que o eleitor seria apático; a democracia de partidos conduziria à desordem; a independência do Poder Judiciário acabaria em injustiça e ineficiência; e que apenas o Poder Executivo, centralizado em Getúlio Vargas, seria capaz de dar racionalidade imparcial ao Estado, pois Vargas teria providencial intuição do bem e da verdade, além de ser um gênio político.

CAMPOS, F. O Estado nacional. Rio de Janeiro: José Olympio, 1940 (adaptado).';
UPDATE questions SET conteudo = 'Brasil República', tags = 'Era Vargas', dificuldade = 'facil' WHERE enunciado = 'A partir de 1942 e estendendo-se até o final do Estado Novo, o Ministro do Trabalho, Indústria e Comércio de Getúlio Vargas falou aos ouvintes da Rádio Nacional semanalmente, por dez minutos, no programa “Hora do Brasil”. O objetivo declarado do governo era esclarecer os trabalhadores acerca das inovações na legislação de proteção ao trabalho.

GOMES, A. C. A invenção do trabalhismo. Rio de Janeiro: IUPERJ / Vértice. São Paulo: Revista dos Tribunais, 1988 (adaptado).';
UPDATE questions SET conteudo = 'Brasil Colônia', tags = 'Catequização', dificuldade = 'medio' WHERE enunciado = 'No final do século XVI, na Bahia, Guiomar de Oliveira denunciou Antônia Nóbrega à Inquisição. Segundo o depoimento, esta lhe dava “uns pós não sabe de quê, e outros pós de osso de finado, os quais pós ela confessante deu a beber em vinho ao dito seu marido para ser seu amigo e serem bem-casados, e que todas estas coisas fez tendo-lhe dito a dita Antônia e ensinado que eram coisas diabólicas e que os diabos lha ensinaram”.

ARAÚJO, E. O teatro dos vícios. Transgressão e transigência na sociedade urbana colonial. Brasília: UnB/José Olympio, 1997.';
UPDATE questions SET conteudo = 'Geopolítica', tags = 'Colonialismo e neocolonialismo', dificuldade = 'dificil' WHERE enunciado = 'A formação dos Estados foi certamente distinta na Europa, na América Latina, na África e na Ásia. Os Estados atuais, em especial na América Latina — onde as instituições das populações locais existentes à época da conquista ou foram eliminadas, como no caso do México e do Peru, ou eram frágeis, como no caso do Brasil —, são o resultado, em geral, da evolução do transplante de instituições europeias feito pelas metrópoles para suas colônias. Na África, as colônias tiveram fronteiras arbitrariamente traçadas, separando etnias, idiomas e tradições, que, mais tarde, sobreviveram ao processo de descolonização, dando razão para conflitos que, muitas vezes, têm sua verdadeira origem em disputas pela exploração de recursos naturais. Na Ásia, a colonização europeia se fez de forma mais indireta e encontrou sistemas políticos e administrativos mais sofisticados, aos quais se superpôs. Hoje, aquelas formas anteriores de organização, ou pelo menos seu espírito, sobrevivem nas organizações políticas do Estado asiático.

GUIMARÃES, S. P. Nação, nacionalismo, Estado. <strong>Estudos Avançados.</strong> São Paulo: EdUSP,  
v. 22, n.º 62, jan.- abr. 2008 (adaptado).';
UPDATE questions SET conteudo = 'Brasil Colônia', tags = 'Escravidão', dificuldade = 'medio' WHERE enunciado = 'No tempo da independência do Brasil, circulavam nas classes populares do Recife trovas que faziam alusão à revolta escrava do Haiti:

Marinheiros e caiados

Todos devem se acabar,

Porque só pardos e pretos

O país hão de habitar.

AMARAL, F. P. do. Apud CARVALHO, A. Estudos pernambucanos. Recife: Cultura Acadêmica, 1907.';
UPDATE questions SET conteudo = 'Brasil República', tags = NULL, dificuldade = 'dificil' WHERE enunciado = 'Colhe o Brasil, após esforço contínuo dilatado no tempo, o que plantou no esforço da construção de sua inserção internacional. Há dois séculos formularam-se os pilares da política externa. Teve o país inteligência de longo prazo e cálculo de oportunidade no mundo difuso da transição da hegemonia britânica para o século americano. Engendrou concepções, conceitos e teoria própria no século XIX, de José Bonifácio ao Visconde do Rio Branco. Buscou autonomia decisória no século XX. As elites se interessaram, por meio de calorosos debates, pelo destino do Brasil. O país emergiu, de Vargas aos militares, como ator responsável e previsível nas ações externas do Estado. A mudança de regime político para a democracia não alterou o pragmatismo externo, mas o aperfeiçoou.

SARAIVA, J. F. S. O lugar do Brasil e o silêncio do parlamento. <strong>Correio Braziliense</strong>, Brasília,  
28 maio 2009 (adaptado).';
UPDATE questions SET conteudo = 'Idade Moderna', tags = 'Revolução industrial', dificuldade = 'medio' WHERE enunciado = 'A prosperidade induzida pela emergência das máquinas de tear escondia uma acentuada perda de prestígio. Foi nessa idade de ouro que os artesãos, ou os tecelões temporários, passaram a ser denominados, de modo genérico, tecelões de teares manuais. Exceto em alguns ramos especializados, os velhos artesãos foram colocados lado a lado com novos imigrantes, enquanto pequenos fazendeiros-tecelões abandonaram suas pequenas propriedades para se concentrar na atividade de tecer. Reduzidos à completa dependência dos teares mecanizados ou dos fornecedores de matéria-prima, os tecelões ficaram expostos a sucessivas reduções dos rendimentos.

THOMPSON, E. P. <strong>The making of the english working class.</strong> Harmondsworth: Penguin Books, 1979 (adaptado).';
UPDATE questions SET conteudo = 'Idade Moderna', tags = 'Revolução industrial', dificuldade = 'facil' WHERE enunciado = 'Até o século XVII, as paisagens rurais eram marcadas por atividades rudimentares e de baixa produtividade. A partir da Revolução Industrial, porém, sobretudo com o advento da revolução tecnológica, houve um desenvolvimento contínuo do setor agropecuário.';
UPDATE questions SET conteudo = 'Literatura', tags = 'Modernismo', dificuldade = 'dificil' WHERE enunciado = 'Como se assistisse à demonstração de um espetáculo mágico, ia revendo aquele ambiente tão característico de família, com seus pesados móveis de vinhático ou de jacarandá, de qualidade antiga, e que denunciavam um passado ilustre, gerações de Meneses talvez mais singelos e mais calmos; agora, uma espécie de desordem, de relaxamento, abastardava aquelas qualidades primaciais. Mesmo assim era fácil perceber o que haviam sido, esses nobres da roça, com seus cristais que brilhavam mansamente na sombra, suas pratas semi- empoeiradas que atestavam o esplendor esvanecido, seus marfins e suas opalinas – ah, respirava-se ali conforto, não havia dúvida, mas era apenas uma sobrevivência de coisas idas. Dir-se-ia, ante esse mundo que se ia desagregando, que um mal oculto o roía, como um tumor latente em suas entranhas.

CARDOSO, L. Crônica da casa assassinada. Rio de Janeiro: Civilização Brasileira, 2002 (adaptado).';
UPDATE questions SET conteudo = 'Brasil Império', tags = 'Segundo Reinado', dificuldade = 'medio' WHERE enunciado = 'O suíço Thomas Davatz chegou a São Paulo em 1855 para trabalhar como colono na fazenda de café Ibicaba, em Campinas. A perspectiva de prosperidade que o atraiu para o Brasil deu lugar a insatisfação e revolta, que ele registrou em livro. Sobre o percurso entre o porto de Santos e o planalto paulista, escreveu Davatz: “As estradas do Brasil, salvo em alguns trechos, são péssimas. Em quase toda parte, falta qualquer espécie de calçamento ou mesmo de saibro. Constam apenas de terra simples, sem nenhum benefício. É fácil prever que nessas estradas não se encontram estalagens e hospedarias como as da Europa. Nas cidades maiores, o viajante pode naturalmente encontrar aposento sofrível; nunca, porém, qualquer coisa de comparável à comodidade que proporciona na Europa qualquer estalagem rural. Tais cidades são, porém, muito poucas na distância que vai de Santos a Ibicaba e que se percorre em cinquenta horas no mínimo”. Em 1867 foi inaugurada a ferrovia ligando Santos a Jundiaí, o que abreviou o tempo de viagem entre o litoral e o planalto para menos de um dia. Nos anos seguintes, foram construídos outros ramais ferroviários que articularam o interior cafeeiro ao porto de exportação, Santos.

DAVATZ, T. <strong>Memórias de um colono no Brasil.</strong> São Paulo: Livraria Martins, 1941 (adaptado).';
UPDATE questions SET conteudo = 'Geografia Econômica', tags = 'Globalização', dificuldade = 'dificil' WHERE enunciado = 'Além dos inúmeros eletrodomésticos e bens eletrônicos, o automóvel produzido pela indústria fordista promoveu, a partir dos anos 50, mudanças significativas no modo de vida dos consumidores e também na habitação e nas cidades. Com a massificação do consumo dos bens modernos, dos eletroeletrônicos e também do automóvel, mudaram radicalmente o modo de vida, os valores, a cultura e o conjunto do ambiente construído. Da ocupação do solo urbano até o interior da moradia, a transformação foi profunda.

MARICATO, E. <strong>Urbanismo na periferia do mundo globalizado: metrópoles brasileiras.</strong> Disponível em: http://www.scielo.br.  
Acesso em: 12 ago. 2009 (adaptado).';
UPDATE questions SET conteudo = 'Geografia Econômica', tags = 'Globalização', dificuldade = 'medio' WHERE enunciado = 'Populações inteiras, nas cidades e na zona rural, dispõem da parafernália digital global como fonte de educação e de formação cultural. Essa simultaneidade de cultura e informação eletrônica com as formas tradicionais e orais é um desafio que necessita ser discutido. A exposição, via mídia eletrônica, com estilos e valores culturais de outras sociedades, pode inspirar apreço, mas também distorções e ressentimentos. Tanto quanto há necessidade de uma cultura tradicional de posse da educação letrada, também é necessário criar estratégias de alfabetização eletrônica, que passam a ser o grande canal de informação das culturas segmentadas no interior dos grandes centros urbanos e das zonas rurais. Um novo modelo de educação.

BRIGAGÃO, C. E.; RODRIGUES, G. <strong>A globalização a olho nu: o mundo conectado.</strong> São Paulo: Moderna, 1998 (adaptado).';
UPDATE questions SET conteudo = 'Geografia Econômica', tags = 'Modelos de produção', dificuldade = 'dificil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/73/c8b4cebd-dcd5-4090-b0ea-049c96a392c7.jpg">';
UPDATE questions SET conteudo = 'Idade Antiga', tags = 'Grécia', dificuldade = 'medio' WHERE enunciado = 'No período 750-338 a. C., a Grécia antiga era composta por cidades-Estado, como por exemplo Atenas, Esparta, Tebas, que eram independentes umas das outras, mas partilhavam algumas características culturais, como a língua grega. No centro da Grécia, Delfos era um lugar de culto religioso frequentado por habitantes de todas as cidades-Estado.

No período 1200-1600 d. C., na parte da Amazônia brasileira onde hoje está o Parque Nacional do Xingu, há vestígios de quinze cidades que eram cercadas por muros de madeira e que tinham até dois mil e quinhentos habitantes cada uma. Essas cidades eram ligadas por estradas a centros cerimoniais com grandes praças. Em torno delas havia roças, pomares e tanques para a criação de tartarugas. Aparentemente, epidemias dizimaram grande parte da população que lá vivia.

Folha de S. Paulo, ago. 2008 (adaptado).';
UPDATE questions SET conteudo = 'Geografia Urbana e Demografia', tags = 'Migrações', dificuldade = 'facil' WHERE enunciado = 'O movimento migratório no Brasil é significativo, principalmente em função do volume de pessoas que saem de uma região com destino a outras regiões. Um desses movimentos ficou famoso nos anos 80, quando muitos nordestinos deixaram a região Nordeste em direção ao Sudeste do Brasil. Segundo os dados do IBGE de 2000, este processo continuou crescente no período seguinte, os anos 90, com um acréscimo de 7,6% nas migrações deste mesmo fluxo. A Pesquisa de Padrão de Vida, feita pelo IBGE, em 1996, aponta que, entre os nordestinos que chegam ao Sudeste, 48,6% exercem trabalhos manuais não qualificados, 18,5% são trabalhadores manuais qualificados, enquanto 13,5%, embora não sejam trabalhadores manuais, se encontram em áreas que não exigem formação profissional. O mesmo estudo indica também que esses migrantes possuem, em média, condição de vida e nível educacional acima dos de seus conterrâneos e abaixo dos de cidadãos estáveis do Sudeste.

Disponível em: http://www.ibge.gov.br. Acesso em: 30 jul. 2009 (adaptado).';
UPDATE questions SET conteudo = 'Geografia Agrária', tags = 'Estrutura fundiária', dificuldade = 'facil' WHERE enunciado = 'Apesar do aumento da produção no campo e da integração entre a indústria e a agricultura, parte da população da América do Sul ainda sofre com a subalimentação, o que gera conflitos pela posse de terra que podem ser verificados em várias áreas e que frequentemente chegam a provocar mortes';
UPDATE questions SET conteudo = 'Geografia Agrária', tags = 'Conflitos no campo', dificuldade = 'medio' WHERE enunciado = 'A luta pela terra no Brasil é marcada por diversos aspectos que chamam a atenção. Entre os aspectos positivos, destaca-se a perseverança dos movimentos do campesinato e, entre os aspectos negativos, a violência que manchou de sangue essa história. Os movimentos pela reforma agrária articularam-se por todo o território nacional, principalmente entre 1985 e 1996, e conseguiram de maneira expressiva a inserção desse tema nas discussões pelo acesso à terra.O mapa seguinte apresenta a distribuição dos conflitos agrários em todas as regiões do Brasil nesse período, e o número de mortes ocorridas nessas lutas.

<img src="https://enem.dev/2009/questions/77/0148040b-fcc5-4e8c-a19f-4c41b9041a27.jpg">

OLIVEIRA, A. U. A longa marcha do campesinato brasileiro: movimentos sociais, conflitos e reforma agrária.  <strong>Revista Estudos Avançados.</strong> Vol. 15 n. 43, São Paulo, set./dez. 2001.';
UPDATE questions SET conteudo = 'Geografia Agrária', tags = 'Estrutura fundiária', dificuldade = 'medio' WHERE enunciado = 'O gráfico mostra o percentual de áreas ocupadas, segundo o tipo de propriedade rural no Brasil, no ano de 2006.

<img src="https://enem.dev/2009/questions/78/85294de7-2d92-41fd-95eb-d3fd892e6e81.jpg">

MDA/INCRA (DIEESE, 2006)  
Disponível em: http://www.sober.org.br. Acesso em: 6 ago. 2009.';
UPDATE questions SET conteudo = 'Geografia Agrária', tags = 'Conflitos no campo', dificuldade = 'facil' WHERE enunciado = 'Entre 2004 e 2008, pelo menos 8 mil brasileiros foram libertados de fazendas onde trabalhavam como se fossem escravos. O governo criou uma lista em que ficaram expostos os nomes dos fazendeiros flagrados pela fiscalização. No Norte, Nordeste e Centro-Oeste, regiões que mais sofrem com a fraqueza do poder público, o bloqueio dos canais de financiamento agrícola para tais fazendeiros tem sido a principal arma de combate a esse problema, mas os governos ainda sofrem com a falta de informações, provocada pelas distâncias e pelo poder intimidador dos proprietários. Organizações não governamentais e grupos como a Pastoral da Terra têm agido corajosamente, acionando as autoridades públicas e ministrando aulas sobre direitos sociais e trabalhistas.

Plano Nacional para Erradicação do Trabalho Escravo”. Disponível em:  
http://www.mte.gov.br. Acesso em: 17 mar. 2009 (adaptado).';
UPDATE questions SET conteudo = 'Impactos Ambientais', tags = 'Poluição', dificuldade = 'facil' WHERE enunciado = 'O homem construiu sua história por meio do constante processo de ocupação e transformação do espaço natural. Na verdade, o que variou, nos diversos momentos da experiência humana, foi a intensidade dessa exploração.

Disponível em: http://www.simposioreformaagraria.propp.ufu.br.  
Acesso em: 09 jul. 2009 (adaptado).';
UPDATE questions SET conteudo = 'Geopolítica', tags = 'Sustentabilidade', dificuldade = 'facil' WHERE enunciado = 'No presente, observa-se crescente atenção aos efeitos da atividade humana, em diferentes áreas, sobre o meio ambiente, sendo constante, nos fóruns internacionais e nas instâncias nacionais, a referência à sustentabilidade como princípio orientador de ações e propostas que deles emanam. A sustentabilidade explica-se pela';
UPDATE questions SET conteudo = 'Geopolítica', tags = 'Conflitos geopolíticos', dificuldade = 'medio' WHERE enunciado = 'Com a perspectiva do desaparecimento das geleiras no Polo Norte, grandes reservas de petróleo e minérios, hoje inacessíveis, poderão ser exploradas. E já atiçam a cobiça das potências.

KOPP, D. Guerra Fria sobre o Ártico. <strong>Le monde diplomatique Brasil.</strong>  
Setembro, n. 2, 2007 (adaptado).';
UPDATE questions SET conteudo = 'Geografia Econômica', tags = 'Fontes de energia', dificuldade = 'medio' WHERE enunciado = 'No mundo contemporâneo, as reservas energéticas tornam-se estratégicas para muitos países no cenário internacional. Os gráficos apresentados mostram os dez países com as maiores reservas de petróleo e gás natural em reservas comprovadas até janeiro de 2008.

<img src="https://enem.dev/2009/questions/83/ad2f947f-ee8f-4f33-b73f-6eeeaf728bb1.jpg">

Disponível em: http://indexmundi.com. Acesso em: 12 ago. 2009 (adaptado).';
UPDATE questions SET conteudo = 'Brasil Colônia', tags = NULL, dificuldade = 'medio' WHERE enunciado = '<img src="https://enem.dev/2009/questions/84/15a16039-43b9-4779-9660-b66387929694.png">

BETHEL, L. História da América. V. I. São Paulo. (Foto: EDUSP)';
UPDATE questions SET conteudo = 'Geografia Agrária', tags = 'Modelos de produção agrícola', dificuldade = 'medio' WHERE enunciado = 'O clima é um dos elementos fundamentais não só na caracterização das paisagens naturais, mas também no histórico de ocupação do espaço geográfico.';
UPDATE questions SET conteudo = 'Impactos Ambientais', tags = 'Mudanças climáticas', dificuldade = 'medio' WHERE enunciado = '<img src="https://enem.dev/2009/questions/86/04d790cc-7221-4d93-a0a7-ea323350509a.jpg">

<img src="https://enem.dev/2009/questions/86/1dec6a28-9c85-4f2d-a6ca-58d1bd4ead05.jpg">';
UPDATE questions SET conteudo = 'Geografia Agrária', tags = 'Modelos de produção agrícola', dificuldade = 'medio' WHERE enunciado = 'Na figura, observa-se uma classificação de regiões da América do Sul segundo o grau de aridez verificado.

<img src="https://enem.dev/2009/questions/87/951db800-9e06-49b2-b3ab-3589923ae034.jpg">

Disponível em: http:// www.mutirao.com.br.  
Acesso em: 5 ago. 2009.';
UPDATE questions SET conteudo = 'Impactos Ambientais', tags = 'Escassez hídrica', dificuldade = 'medio' WHERE enunciado = 'À medida que a demanda por água aumenta, as reservas desse recurso vão se tornando imprevisíveis. Modelos matemáticos que analisam os efeitos das mudanças climáticas sobre a disponibilidade de água no futuro indicam que haverá escassez em muitas regiões do planeta. São esperadas mudanças nos padrões de precipitação, pois';
UPDATE questions SET conteudo = 'Geografia Urbana e Demografia', tags = NULL, dificuldade = 'dificil' WHERE enunciado = 'A mais profunda objeção que se faz à ideia da criação de uma cidade, como Brasília, é que o seu desenvolvimento não poderá jamais ser natural. É uma objeção muito séria, pois provém de uma concepção de vida fundamental: a de que a atividade social e cultural não pode ser uma construção. Esquecem-se, porém, aqueles que fazem tal crítica, que o Brasil, como praticamente toda a América, é criação do homem ocidental.

PEDROSA, M. Utopia: obra de arte. <strong>Vis – Revista do Programa de</strong>  
<strong>Pós-graduação em Arte (UnB)</strong>, Vol. 5, n. 1, 2006 (adaptado).';
UPDATE questions SET conteudo = 'Impactos Ambientais', tags = 'Desmatamento', dificuldade = 'medio' WHERE enunciado = 'As áreas do planalto do cerrado – como a chapada dos Guimarães, a serra de Tapirapuã e a serra dos Parecis, no Mato Grosso, com altitudes que variam de 400 m a 800 m – são importantes para a planície pantaneira mato-grossense (com altitude média inferior a 200 m), no que se refere à manutenção do nível de água, sobretudo durante a estiagem. Nas cheias, a inundação ocorre em função da alta pluviosidade nas cabeceiras dos rios, do afloramento de lençóis freáticos e da baixa declividade do relevo, entre outros fatores. Durante a estiagem, a grande biodiversidade é assegurada pelas águas da calha dos principais rios, cujo volume tem diminuído, principalmente nas cabeceiras.

Cabeceiras ameaçadas. <strong>Ciência Hoje</strong>. Rio de Janeiro:  
SBPC. Vol. 42, jun. 2008 (adaptado).';
UPDATE questions SET conteudo = 'Artes', tags = NULL, dificuldade = 'medio' WHERE enunciado = 'Os melhores críticos da cultura brasileira trataram-na sempre no plural, isto é, enfatizando a coexistência no Brasil de diversas culturas. Arthur Ramos distingue as culturas não europeias (indígenas, negras) das europeias (portuguesa, italiana, alemã etc.), e Darcy Ribeiro fala de diversos Brasis: crioulo, caboclo, sertanejo, caipira e de Brasis sulinos, a cada um deles correspondendo uma cultura específica.

MORAIS, F. <strong>O Brasil na visão do artista: o país e sua cultura.</strong>  
São Paulo: Sudameris, 2003.';
UPDATE questions SET conteudo = 'Variações Linguísticas', tags = 'Normas linguísticas', dificuldade = 'facil' WHERE enunciado = 'Gerente – Boa tarde. Em que eu posso ajudá-lo?  
Cliente – Estou interessado em financiamento para compra  
de veículo.  
Gerente – Nós dispomos de várias modalidades de crédito.  
O senhor é nosso cliente?  
Cliente – Sou Júlio César Fontoura, também sou  
funcionário do banco.  
Gerente – Julinho, é você, cara? Aqui é a Helena! Cê tá  
em Brasília? Pensei que você inda tivesse na agência de  
Uberlândia! Passa aqui pra gente conversar com calma.

BORTONI-RICARDO, S. M. <strong>Educação em língua materna.</strong>  
São Paulo: Parábola, 2004 (adaptado).';
UPDATE questions SET conteudo = 'Interpretação de Texto', tags = NULL, dificuldade = 'facil' WHERE enunciado = 'Analise as seguintes avaliações de possíveis resultados de  
um teste na Internet.

<img src="https://enem.dev/2009/questions/93/78a6b697-0241-4008-8983-636d150e26a1.png">';
UPDATE questions SET conteudo = 'Artes', tags = NULL, dificuldade = 'medio' WHERE enunciado = 'A música pode ser definida como a combinação de sons ao longo do tempo. Cada produto final oriundo da infinidade de combinações possíveis será diferente, dependendo da escolha das notas, de suas durações, dos instrumentos utilizados, do estilo de música, da nacionalidade do compositor e do período em que as obras foram compostas.

<img src="https://enem.dev/2009/questions/94/282c49bb-1204-48bd-94f0-655923c3210e.png">

<img src="https://enem.dev/2009/questions/94/c2791052-0250-4108-b050-c836866cc800.png">

Figura 1 – http://images.quebarato.com.br/photos/big/2/D/15A12D\_2.jpg.  
Figura 2 – http://ourinhos.prefeituramunicipal.net/dados/fotos/2009/07/07/normal.  
Figura 3 – http://www.edmontonculturalcapital.com/gallery/edjazzfestival/JazzQuartet.jpg  
Figura 4 – http://www.filmica.com/jacintaescudos/archivos/Led-Zeppelin.jpg.';
UPDATE questions SET conteudo = 'Artes', tags = 'Surrealismo', dificuldade = 'dificil' WHERE enunciado = 'No programa do balé Parade, apresentado em 18 de maio de 1917, foi empregada publicamente, pela primeira vez, a palavra <em>sur-realisme</em>. Pablo Picasso desenhou o cenário e a indumentária, cujo efeito foi tão surpreendente que se sobrepôs à coreografia. A música de Erik Satie era uma mistura de <em>jazz</em>, música popular e sons reais tais como tiros de pistola, combinados com as imagens do balé de Charlie Chaplin, caubóis e vilões, mágica chinesa e <em>Ragtime</em>. Os tempos não eram propícios para receber a nova mensagem cênica demasiado provocativa devido ao repicar da máquina de escrever, aos zumbidos de sirene e dínamo e aos rumores de aeroplano previstos por Cocteau para a partitura de Satie. Já a ação coreográfica confirmava a tendência marcadamente teatral da gestualidade cênica, dada pela justaposição, colagem de ações isoladas seguindo um estímulo musical.

SILVA, S. M. <strong>O surrealismo e a dança</strong>. GUINSBURG, J.; LEIRNER (Org.). O surrealismo. São Paulo: Perspectiva, 2008 (adaptado).';
UPDATE questions SET conteudo = 'Campanhas Publicitárias', tags = NULL, dificuldade = 'facil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/96/05bce341-8926-454e-8c24-49814582373d.jpg">';
UPDATE questions SET conteudo = 'Gêneros Textuais', tags = NULL, dificuldade = 'facil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/97/21bc16d2-a579-454e-ade1-28f57b52d15d.jpg">';
UPDATE questions SET conteudo = 'Gramática', tags = 'Fonética e Fonologia', dificuldade = 'medio' WHERE enunciado = '<strong>Para o Mano Caetano</strong>

O que fazer do ouro de tolo  
Quando um doce bardo brada a toda brida,  
Em velas pandas, suas esquisitas rimas?  
Geografia de verdades, Guanabaras postiças  
Saudades banguelas, tropicais preguiças?

A boca cheia de dentes  
De um implacável sorriso  
Morre a cada instante  
Que devora a voz do morto, e com isso,  
Ressuscita vampira, sem o menor aviso

\[…\]  
E eu <em>soy</em> lobo-bolo? lobo-bolo  
Tipo pra rimar com ouro de tolo?  
Oh, Narciso Peixe Ornamental!  
<em>Tease me</em>, <em>tease me</em> outra vez¹  
Ou em banto baiano  
Ou em português de Portugal  
Se quiser, até mesmo em americano  
De Natal  
\[…\]

<em>¹Tease me</em> (caçoe de mim, importune-me).

LOBÃO. Disponível em: http://vagalume.uol.com.br.  
Acesso em: 14 ago. 2009 (adaptado).';
UPDATE questions SET conteudo = 'Literatura', tags = 'Simbolismo', dificuldade = 'medio' WHERE enunciado = '<strong>Cárcere das almas</strong>

Ah! Toda a alma num cárcere anda presa,  
Soluçando nas trevas, entre as grades  
Do calabouço olhando imensidades,  
Mares, estrelas, tardes, natureza.

Tudo se veste de uma igual grandeza  
Quando a alma entre grilhões as liberdades  
Sonha e, sonhando, as imortalidades  
Rasga no etéreo o Espaço da Pureza.

Ó almas presas, mudas e fechadas  
Nas prisões colossais e abandonadas,  
Da Dor no calabouço, atroz, funéreo!

Nesses silêncios solitários, graves,  
que chaveiro do Céu possui as chaves  
para abrir-vos as portas do Mistério?!

CRUZ E SOUSA, J. <strong>Poesia completa.</strong> Florianópolis: Fundação Catarinense de Cultura /  
Fundação Banco do Brasil, 1993.';
UPDATE questions SET conteudo = 'Interpretação de Texto', tags = NULL, dificuldade = 'facil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/100/8d5cbf39-b768-437a-a494-eb718d3f64a5.jpg">';
UPDATE questions SET conteudo = 'Gêneros Textuais', tags = NULL, dificuldade = 'facil' WHERE enunciado = 'Gênero dramático é aquele em que o artista usa como intermediária entre si e o público a representação. A palavra vem do grego <em>drao</em> (fazer) e quer dizer ação. A peça teatral é, pois, uma composição literária destinada à apresentação por atores em um palco, atuando e dialogando entre si. O texto dramático é complementado pela atuação dos atores no espetáculo teatral e possui uma estrutura específica, caracterizada: 1) pela presença de personagens que devem estar ligados com lógica uns aos outros e à ação; 2) pela ação dramática (trama, enredo), que é o conjunto de atos dramáticos, maneiras de ser e de agir das personagens encadeadas à unidade do efeito e segundo uma ordem composta de exposição, conflito, complicação, clímax e desfecho; 3) pela situação ou ambiente, que é o conjunto de circunstâncias físicas, sociais, espirituais em que se situa a ação; 4) pelo tema, ou seja, a ideia que o autor (dramaturgo) deseja expor, ou sua interpretação real por meio da representação.

COUTINHO, A. <strong>Notas de teoria literária.</strong> Rio de Janeiro:  
Civilização Brasileira, 1973 (adaptado).';
UPDATE questions SET conteudo = 'Interpretação de Texto', tags = NULL, dificuldade = 'facil' WHERE enunciado = 'Saúde, no modelo atual de qualidade de vida, é o resultado das condições de alimentação, habitação, educação, renda, trabalho, transporte, lazer, serviços médicos e acesso à atividade física regular. Quanto ao acesso à atividade física, um dos elementos essenciais é a aptidão física, entendida como a capacidade de a pessoa utilizar seu corpo — incluindo músculos, esqueleto, coração, enfim, todas as partes —, de forma eficiente em suas atividades cotidianas; logo, quando se avalia a saúde de uma pessoa, a aptidão física deve ser levada em conta.';
UPDATE questions SET conteudo = 'Tecnologias', tags = NULL, dificuldade = 'medio' WHERE enunciado = 'Diferentemente do texto escrito, que em geral compele os leitores a lerem numa onda linear – da esquerda para a direita e de cima para baixo, na página  
impressa – hipertextos encorajam os leitores a moverem-se de um bloco de texto a outro, rapidamente e não sequencialmente. Considerando que o hipertexto oferece uma multiplicidade de caminhos a seguir, podendo ainda o leitor incorporar seus caminhos e suas decisões como novos caminhos, inserindo informações novas, o leitor-navegador passa a ter um papel mais ativo e uma oportunidade diferente da de um leitor de texto impresso. Dificilmente dois leitores de hipertextos farão os mesmos caminhos e tomarão as mesmas decisões.

MARCUSCHI, L. A. <strong>Cognição, linguagem e práticas interacionais.</strong>  
Rio: Lucerna, 2007.';
UPDATE questions SET conteudo = 'Charges e Hqs', tags = NULL, dificuldade = 'facil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/105/d37499f0-6363-4d99-8d33-c682027d79d7.jpg">';
UPDATE questions SET conteudo = 'Tecnologias', tags = NULL, dificuldade = 'facil' WHERE enunciado = 'A partir da metade do século XX, ocorreu um conjunto de transformações econômicas e sociais cuja dimensão é difícil de ser mensurada: a chamada explosão da informação. Embora essa expressão tenha surgido no contexto da informação científica e tecnológica, seu significado, hoje, em um contexto mais geral, atinge proporções gigantescas.  
Por estabelecerem novas formas de pensamento e mesmo de lógica, a informática e a Internet vêm gerando impactos sociais e culturais importantes. A disseminação do microcomputador e a expansão da Internet vêm acelerando o processo de globalização tanto no sentido do mercado quanto no sentido das trocas simbólicas possíveis entre sociedades e culturas diferentes, o que tem provocado e acelerado o fenômeno de hibridização amplamente caracterizado como próprio da pós-modernidade.

FERNANDES, M. F.; PARÁ, T. <strong>A contribuição das novas tecnologias da informação na geração de conhecimento.</strong> Disponível em: http://www.coep.ufrj.br.  
Acesso em: 11 ago. 2009 (adaptado).';
UPDATE questions SET conteudo = 'Estratégias Argumentativas', tags = NULL, dificuldade = 'medio' WHERE enunciado = '<strong>Texto I</strong>  
É praticamente impossível imaginarmos nossas vidas sem o plástico. Ele está presente em embalagens de alimentos, bebidas e remédios, além de eletrodomésticos, automóveis etc. Esse uso ocorre devido à sua atoxicidade e à inércia, isto é: quando em contato com outra substâncias, o plástico não as contamina; ao contrário, protege o produto embalado. Outras duas grandes vantagens garantem o uso dos plásticos em larga escala: são leves, quase não alteram o peso do material embalado, e são 100% recicláveis, fato que, infelizmente, não é aproveitado, visto que, em todo o mundo, a percentagem de plástico reciclado, quando comparado ao total produzido, ainda é irrelevante.

<strong>Revista Mãe Terra</strong>. Minuano, ano I, n. 6 (adaptado).

<strong>Texto II</strong>  
Sacolas plásticas são leves e voam ao vento. Por isso, elas entopem esgotos e bueiros, causando enchentes. São encontradas até no estômago de tartarugas marinhas, baleias, focas e golfinhos, mortos por sufocamento.  
Sacolas plásticas descartáveis são gratuitas para os consumidores, mas têm um custo incalculável para o meio ambiente.

<strong>Veja</strong>, 8 jul. 2009. Fragmentos de texto publicitário do  
Instituto Akatu pelo Consumo Consciente.';
UPDATE questions SET conteudo = 'Interpretação de Texto', tags = NULL, dificuldade = 'facil' WHERE enunciado = '<strong>Texto I</strong>  
É praticamente impossível imaginarmos nossas vidas sem o plástico. Ele está presente em embalagens de alimentos, bebidas e remédios, além de eletrodomésticos, automóveis etc. Esse uso ocorre devido à sua atoxicidade e à inércia, isto é: quando em contato com outra substâncias, o plástico não as contamina; ao contrário, protege o produto embalado. Outras duas grandes vantagens garantem o uso dos plásticos em larga escala: são leves, quase não alteram o peso do material embalado, e são 100% recicláveis, fato que, infelizmente, não é aproveitado, visto que, em todo o mundo, a percentagem de plástico reciclado, quando comparado ao total produzido, ainda é irrelevante.

<strong>Revista Mãe Terra</strong>. Minuano, ano I, n. 6 (adaptado).

<strong>Texto II</strong>  
Sacolas plásticas são leves e voam ao vento. Por isso, elas entopem esgotos e bueiros, causando enchentes. São encontradas até no estômago de tartarugas marinhas, baleias, focas e golfinhos, mortos por sufocamento.  
Sacolas plásticas descartáveis são gratuitas para os consumidores, mas têm um custo incalculável para o meio ambiente.

<strong>Veja</strong>, 8 jul. 2009. Fragmentos de texto publicitário do  
Instituto Akatu pelo Consumo Consciente.';
UPDATE questions SET conteudo = 'Charges e Hqs', tags = NULL, dificuldade = 'facil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/109/1422ce0e-d489-4fc4-af98-06be69f0d8e8.jpg">';
UPDATE questions SET conteudo = 'Tecnologias', tags = NULL, dificuldade = 'facil' WHERE enunciado = 'O “Portal Domínio Público”, lançado em novembro de 2004, propõe o compartilhamento de conhecimentos de forma equânime e gratuita, colocando à disposição de todos os usuários da Internet, uma biblioteca virtual que deverá constituir referência para professores, alunos, pesquisadores e para a população em geral.  
Esse portal constitui um ambiente virtual que permite a coleta, a integração, a preservação e o compartilhamento de conhecimentos, sendo seu principal objetivo o de promover o amplo acesso às obras literárias, artísticas e científicas (na forma de textos, sons, imagens e vídeos), já em domínio público ou que tenham a sua divulgação devidamente autorizada.

<strong>BRASIL.</strong> Ministério da Educação. Disponível em: http://www.dominiopublico.gov.br.  
Acesso em: 29 jul. 2009 (adaptado).';
UPDATE questions SET conteudo = 'Variações Linguísticas', tags = 'Patrimônio linguístico', dificuldade = 'medio' WHERE enunciado = '<strong>Cuitelinho</strong>

Cheguei na bera do porto  
Onde as onda se espaia.  
As garça dá meia volta,  
Senta na bera da praia.  
E o cuitelinho não gosta  
Que o botão da rosa caia.

Quando eu vim da minha terra,  
Despedi da parentaia.  
Eu entrei em Mato Grosso,  
Dei em terras paraguaia.  
Lá tinha revolução,  
Enfrentei fortes bataia.

A tua saudade corta  
Como o aço de navaia.  
O coração fica aflito,  
Bate uma e outra faia.  
E os oio se enche d´água  
Que até a vista se atrapaia.

Folclore recolhido por Paulo Vanzolini e Antônio Xandó.  
BORTONI-RICARDO, S. M. <strong>Educação em língua materna.</strong> São Paulo: Parábola, 2004.';
UPDATE questions SET conteudo = 'Intertextualidade', tags = NULL, dificuldade = 'medio' WHERE enunciado = '<img src="https://enem.dev/2009/questions/112/4d3d4611-5050-4e7e-8329-d76f2c17ca69.jpg">

A feição deles é serem pardos, maneira d’avermelhados, de bons rostos e bons narizes, bem feitos. Andam nus, sem nenhuma cobertura, nem estimam nenhuma cousa cobrir, nem mostrar suas vergonhas. E estão acerca disso com tanta inocência como têm em mostrar o rosto.

CAMINHA, P. V. <strong>A carta.</strong> Disponível em: www.dominiopublico.gov.br.  
Acesso em: 12 ago. 2009.';
UPDATE questions SET conteudo = 'Tecnologias', tags = NULL, dificuldade = 'facil' WHERE enunciado = 'As tecnologias de informação e comunicação (TIC) vieram aprimorar ou substituir meios tradicionais de comunicação e armazenamento de informações, tais como o rádio e a TV analógicos, os livros, os telégrafos, o fax etc. As novas bases tecnológicas são mais poderosas e versáteis, introduziram fortemente a possibilidade de comunicação interativa e estão presentes em todos os meios produtivos da atualidade. As novas TIC vieram acompanhadas da chamada Digital Divide, Digital Gap ou Digital Exclusion, traduzidas para o português como Divisão Digital ou Exclusão Digital, sendo, às vezes, também usados os termos Brecha Digital ou Abismo Digital. Nesse contexto, a expressão Divisão Digital refere-se a';
UPDATE questions SET conteudo = 'Campanhas Publicitárias', tags = NULL, dificuldade = 'facil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/114/210b6d6d-83b0-4ea3-9e5e-f132e9192614.jpg">

Você sabia que as metrópoles são as grandes consumidoras dos produtos feitos com recursos naturais da Amazônia? Você pode diminuir os impactos à floresta adquirindo produtos com selos de certificação. Eles são encontrados em itens que vão desde lápis e embalagens de papelão até móveis, cosméticos e materiais de construção. Para receber os selos esses produtos devem ser fabricados sob 10 princípios éticos, entre eles o respeito à legislação ambiental e aos direitos de povos indígenas e populações que vivem em nossas matas nativas.

<strong>Vida simples</strong>. Ed. 74, dez. 2008.';
UPDATE questions SET conteudo = 'Artes', tags = NULL, dificuldade = 'medio' WHERE enunciado = 'A dança é importante para o índio preparar o corpo e a garganta e significa energia para o corpo, que fica robusto. Na aldeia, para preparo físico, dançamos desde cinco horas da manhã até seis horas da tarde, passa-se o dia inteiro dançando quando os padrinhos planejam a dança dos adolescentes. O padrinho é como um professor, um preparador físico dos adolescentes. Por exemplo, o padrinho sonha com um determinado canto e planeja para todos entoarem. Todos os tipos de dança vêm dos primeiros xavantes: Wamarĩdzadadzeiwawẽ, Butséwawẽ, Tseretomodzatsewawẽ, que foram descobrindo através da sabedoria como iria ser a cultura Xavante. Até hoje existe essa cultura, essa celebração. Quando o adolescente fura a orelha é obrigatório ele dançar toda a noite, tem de acordar meia-noite para dançar e cantar, é obrigatório, eles vão chamando um ao outro com um grito especial.

WÉRÉ’ É TSI’RÓBÓ, E. A dança e o canto-celebração da existência xavante. <strong>VIS-Revista do</strong> <strong>Programa de Pós-Graduação em Arte da UnB.</strong> V. 5, n. 2, dez. 2006.';
UPDATE questions SET conteudo = 'Funções da Linguagem', tags = NULL, dificuldade = 'facil' WHERE enunciado = '<strong>Canção do vento e da minha vida</strong>

O vento varria as folhas,  
O vento varria os frutos,  
O vento varria as flores…  
 E a minha vida ficava  
 Cada vez mais cheia  
 De frutos, de flores, de folhas.  
\[…\]  
O vento varria os sonhos  
E varria as amizades…  
O vento varria as mulheres…  
 E a minha vida ficava  
 Cada vez mais cheia  
 De afetos e de mulheres.

O vento varria os meses  
E varria os teus sorrisos…  
O vento varria tudo!  
 E a minha vida ficava  
 Cada vez mais cheia  
 De tudo.

BANDEIRA, M. <strong>Poesia completa e prosa.</strong> Rio de Janeiro: José Aguilar, 1967.';
UPDATE questions SET conteudo = 'Figuras de Linguagem', tags = NULL, dificuldade = 'medio' WHERE enunciado = '<strong>Canção do vento e da minha vida</strong>

O vento varria as folhas,  
O vento varria os frutos,  
O vento varria as flores…  
 E a minha vida ficava  
 Cada vez mais cheia  
 De frutos, de flores, de folhas.  
\[…\]  
O vento varria os sonhos  
E varria as amizades…  
O vento varria as mulheres…  
 E a minha vida ficava  
 Cada vez mais cheia  
 De afetos e de mulheres.

O vento varria os meses  
E varria os teus sorrisos…  
O vento varria tudo!  
 E a minha vida ficava  
 Cada vez mais cheia  
 De tudo.

BANDEIRA, M. <strong>Poesia completa e prosa.</strong> Rio de Janeiro: José Aguilar, 1967.';
UPDATE questions SET conteudo = 'Artes', tags = NULL, dificuldade = 'medio' WHERE enunciado = 'Teatro do Oprimido é um método teatral que sistematiza exercícios, jogos e técnicas teatrais elaboradas pelo teatrólogo brasileiro Augusto Boal, recentemente falecido, que visa à desmecanização física e intelectual de seus praticantes. Partindo do princípio de que a linguagem teatral não deve ser diferenciada da que é usada cotidianamente pelo cidadão comum (oprimido), ele propõe condições práticas para que o oprimido se aproprie dos meios do fazer teatral e, assim, amplie suas possibilidades de expressão. Nesse sentido, todos podem desenvolver essa linguagem e, consequentemente, fazer teatro. Trata-se de um teatro em que o espectador é convidado a substituir o protagonista e mudar a condução ou mesmo o fim da história, conforme o olhar interpretativo e contextualizado do receptor.

<strong>Companhia Teatro do Oprimido</strong>. Disponível em: www.ctorio.org.br.  
Acesso em: 1 jul. 2009 (adaptado).';
UPDATE questions SET conteudo = 'Variações Linguísticas', tags = 'Normas linguísticas', dificuldade = 'medio' WHERE enunciado = '<strong>Texto I</strong>  
O professor deve ser um guia seguro, muito senhor de sua língua; se outra for a orientação, vamos cair na “língua brasileira”, refúgio nefasto e confissão nojenta de ignorância do idioma pátrio, recurso vergonhoso de homens de cultura falsa e de falso patriotismo. Como havemos de querer que respeitem a nossa nacionalidade se somos os primeiros a descuidar daquilo que exprime e representa o idioma pátrio?

ALMEIDA, N. M. <strong>Gramática metódica da língua portuguesa.</strong>  
<strong>Prefácio.</strong> São Paulo: Saraiva, 1999 (adaptado).

<strong>Texto II</strong>  
Alguns leitores poderão achar que a linguagem desta Gramática se afasta do padrão estrito usual neste tipo de livro. Assim, o autor escreve <em>tenho que reformular</em>, e não <em>tenho de reformular</em>; <em>pode-se colocar dois constituintes</em>, e não <em>podem-se colocar dois constituintes</em>; e assim por diante. Isso foi feito de caso pensado, com a preocupação de aproximar a linguagem da gramática do padrão atual brasileiro presente nos textos técnicos jornalísticos de nossa época.

REIS, N. Nota do editor. PERINI, M. A. <strong>Gramática descritiva</strong>  
<strong>do português.</strong> São Paulo: Ática, 1996.';
UPDATE questions SET conteudo = 'Literatura', tags = 'Realismo', dificuldade = 'dificil' WHERE enunciado = 'No decênio de 1870, Franklin Távora defendeu a tese de que no Brasil havia duas literaturas independentes dentro da mesma língua: uma do Norte e outra do Sul, regiões segundo ele muito diferentes por formação histórica, composição étnica, costumes, modismos linguísticos etc. Por isso, deu aos romances regionais que  
publicou o título geral de <strong>Literatura do Norte</strong>. Em nossos dias, um escritor gaúcho, Viana Moog, procurou mostrar com bastante engenho que no Brasil há, em verdade, literaturas setoriais diversas, refletindo as características locais.

CANDIDO, A. A nova narrativa. <strong>A educação pela noite e</strong>  
<strong>outros ensaios.</strong> São Paulo: Ática, 2003';
UPDATE questions SET conteudo = 'Estratégias Argumentativas', tags = NULL, dificuldade = 'medio' WHERE enunciado = 'Quando eu falo com vocês, procuro usar o código de vocês. A figura do índio no Brasil de hoje não pode ser aquela de 500 anos atrás, do passado, que representa aquele primeiro contato. Da mesma forma que o Brasil de hoje não é o Brasil de ontem, tem 160 milhões de pessoas com diferentes sobrenomes. Vieram para cá asiáticos, europeus, africanos, e todo mundo quer ser brasileiro. A importante pergunta que nós fazemos é: qual é o pedaço de índio que vocês têm? O seu cabelo? São seus olhos? Ou é o nome da sua rua? O nome da sua praça? Enfim, vocês devem ter um pedaço de índio dentro de vocês. Para nós, o importante é que vocês olhem para a gente como seres humanos, como pessoas que nem precisam de paternalismos, nem precisam ser tratadas com privilégios. Nós não queremos tomar o Brasil de vocês, nós queremos compartilhar esse Brasil com vocês.

TERENA, M. Debate. MORIN, E. <strong>Saberes globais e saberes locais.</strong>  
Rio de Janeiro: Garamond, 2000 (adaptado).';
UPDATE questions SET conteudo = 'Variações Linguísticas', tags = 'Normas linguísticas', dificuldade = 'medio' WHERE enunciado = 'Quando eu falo com vocês, procuro usar o código de vocês. A figura do índio no Brasil de hoje não pode ser aquela de 500 anos atrás, do passado, que representa aquele primeiro contato. Da mesma forma que o Brasil de hoje não é o Brasil de ontem, tem 160 milhões de pessoas com diferentes sobrenomes. Vieram para cá asiáticos, europeus, africanos, e todo mundo quer ser brasileiro. A importante pergunta que nós fazemos é: qual é o pedaço de índio que vocês têm? O seu cabelo? São seus olhos? Ou é o nome da sua rua? O nome da sua praça? Enfim, vocês devem ter um pedaço de índio dentro de vocês. Para nós, o importante é que vocês olhem para a gente como seres humanos, como pessoas que nem precisam de paternalismos, nem precisam ser tratadas com privilégios. Nós não queremos tomar o Brasil de vocês, nós queremos compartilhar esse Brasil com vocês.

TERENA, M. Debate. MORIN, E. <strong>Saberes globais e saberes locais.</strong>  
Rio de Janeiro: Garamond, 2000 (adaptado).';
UPDATE questions SET conteudo = 'Crítica Social, Cultural e Artística', tags = NULL, dificuldade = 'medio' WHERE enunciado = '<strong>Se os tubarões fossem homens</strong>

Se os tubarões fossem homens, eles seriam mais gentis com os peixes pequenos?  
Certamente, se os tubarões fossem homens, fariam construir resistentes gaiolas no mar para os peixes pequenos, com todo o tipo de alimento, tanto animal como vegetal. Cuidariam para que as gaiolas tivessem sempre água fresca e adotariam todas as providências sanitárias.  
Naturalmente haveria também escolas nas gaiolas. Nas aulas, os peixinhos aprenderiam como nadar para a goela dos tubarões. Eles aprenderiam, por exemplo, a usar a geografia para localizar os grandes tubarões deitados preguiçosamente por aí. A aula principal seria, naturalmente, a formação moral dos peixinhos. A eles seria ensinado que o ato mais grandioso e mais sublime é o sacrifício alegre de um peixinho e que todos deveriam acreditar nos tubarões, sobretudo quando estes dissessem que cuidavam de sua felicidade futura. Os peixinhos saberiam que este futuro só estaria garantido se aprendessem a obediência.  
Cada peixinho que na guerra matasse alguns peixinhos inimigos seria condecorado com uma pequena Ordem das Algas e receberia o título de herói.

BRECHT, B. <strong>Histórias do Sr. Keuner</strong>. São Paulo: Ed. 34, 2006 (adaptado)';
UPDATE questions SET conteudo = 'Figuras de Linguagem', tags = NULL, dificuldade = 'dificil' WHERE enunciado = 'Oximoro, ou paradoxismo, é uma figura de retórica em que se combinam palavras de sentido oposto que parecem excluir-se mutuamente, mas que, no contexto, reforçam a expressão.

<strong>Dicionário Eletrônico Houaiss da Língua Portuguesa.</strong>';
UPDATE questions SET conteudo = 'Variações Linguísticas', tags = 'Normas linguísticas', dificuldade = 'facil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/125/5a4ecb2b-fa74-43e5-a8ad-89db87b4e9ba.jpg">';
UPDATE questions SET conteudo = 'Gêneros Textuais', tags = NULL, dificuldade = 'medio' WHERE enunciado = '<img src="https://enem.dev/2009/questions/126/b72a01dc-1bf6-4dea-96b7-31e38144d132.jpg">';
UPDATE questions SET conteudo = 'Recursos Argumentativos', tags = NULL, dificuldade = 'facil' WHERE enunciado = '<img src="https://enem.dev/2009/questions/127/798e9623-046e-493b-8d10-455dffae35db.jpg">';
UPDATE questions SET conteudo = 'Literatura', tags = 'Contemporânea', dificuldade = 'medio' WHERE enunciado = '<strong>A partida</strong>

Acordei pela madrugada. A princípio com tranquilidade, e logo com obstinação, quis novamente dormir. Inútil, o sono esgotara-se. Com precaução, acendi um fósforo: passava das três. Restava-me, portanto, menos de duas horas, pois o trem chegaria às cinco. Veio-me então o desejo de não passar mais nem uma hora naquela casa. Partir, sem dizer nada, deixar quanto antes minhas cadeias de disciplina e de amor.  
Com receio de fazer barulho, dirigi-me à cozinha, lavei o rosto, os dentes, penteei-me e, voltando ao meu quarto, vesti-me. Calcei os sapatos, sentei-me um instante à beira da cama. Minha avó continuava dormindo. Deveria fugir ou falar com ela? Ora, algumas palavras… Que me custava acordá-la, dizer-lhe adeus?

LINS, O. A partida. <strong>Melhores contos.</strong> Seleção e prefácio de  
Sandra Nitrini. São Paulo: Global, 2003.';
UPDATE questions SET conteudo = 'Variações Linguísticas', tags = 'Normas linguísticas', dificuldade = 'dificil' WHERE enunciado = 'Serafim da Silva Neto defendia a tese da unidade da língua portuguesa no Brasil, entrevendo que no Brasil as delimitações dialetais espaciais não eram tão marcadas como as isoglossas¹ da România Antiga. Mas Paul Teyssier, na sua <strong>História da Língua Portuguesa</strong>, reconhece que na diversidade socioletal essa pretensa unidade se desfaz. Diz Teyssier: “A realidade, porém, é que as divisões ‘dialetais’ no Brasil são menos geográficas que socioculturais. As diferenças na maneira de falar são maiores, num determinado lugar, entre um homem culto e o vizinho analfabeto que entre dois brasileiros do mesmo nível cultural originários de duas regiões distantes uma da outra.”

SILVA, R. V. M. <strong>O português brasileiro e o português europeu</strong>  
<strong>contemporâneo: alguns aspectos da diferença.</strong> Disponível em:  
www.uniroma.it. Acesso em: 23 jun. 2008.

¹ isoglossa – linha imaginária que, em um mapa, une os pontos de ocorrência de traços e fenômenos linguísticos idênticos.

FERREIRA, A. B. H. <strong>Novo dicionário Aurélio da língua portuguesa.</strong>  
Rio de Janeiro: Nova Fronteira, 1986.';
UPDATE questions SET conteudo = 'Variações Linguísticas', tags = 'Patrimônio linguístico', dificuldade = 'dificil' WHERE enunciado = 'Nestes últimos anos, a situação mudou bastante e o Brasil, normalizado, já não nos parece tão mítico, no bem e no mal. Houve um mútuo reconhecimento entre os dois países de expressão portuguesa de um lado e do outro do Atlântico: o Brasil descobriu Portugal e Portugal, em um retorno das caravelas, voltou a descobrir o Brasil e a ser, por seu lado, colonizado por expressões linguísticas, as telenovelas, os romances, a poesia, a comida e as formas de tratamento brasileiros. O mesmo, embora em nível superficial, dele excluído o plano da língua, aconteceu com a Europa, que, depois da diáspora dos anos 70, depois da inserção na cultura da bossa-nova e da música popular brasileira, da problemática ecológica centrada na Amazônia, ou da problemática social emergente do fenômeno dos meninos de rua, e até do álibi ocultista dos romances de Paulo Coelho, continua todos os dias a descobrir, no bem e no mal, o novo Brasil. Se, no fim do século XIX, Sílvio Romero definia a literatura brasileira como manifestação de um país mestiço, será fácil para nós defini-la como expressão de um país polifônico: em que já não é determinante o eixo Rio-São Paulo, mas que, em cada região, desenvolve originalmente a sua unitária e particular tradição cultural. É esse, para nós, no início do século XXI, o novo estilo brasileiro.

STEGAGNO-PICCHIO, L. <strong>História da literatura brasileira.</strong>  
Rio de Janeiro: Nova Aguilar, 2004 (adaptado).';
UPDATE questions SET conteudo = 'Variações Linguísticas', tags = 'Patrimônio linguístico', dificuldade = 'dificil' WHERE enunciado = '<strong>Texto I</strong>  
Acompanhando os navegadores, colonizadores e comerciantes portugueses em todas as suas incríveis viagens, a partir do século XV, o português se transformou na língua de um império. Nesse processo, entrou em contato — forçado, o mais das vezes; amigável, em alguns casos — com as mais diversas línguas, passando por processos de variação e de mudança linguística. Assim, contar a história do português do Brasil é mergulhar na sua história colonial e de país independente, já que as línguas não são mecanismos desgarrados dos povos que as utilizam. Nesse cenário, são muitos os aspectos da estrutura linguística que não só expressam a diferença entre Portugal e Brasil como também definem, no Brasil, diferenças regionais e sociais.

PAGOTTO, E. P. <strong>Línguas do Brasil.</strong> Disponível em: http://cienciaecultura.bvs.br.  
Acesso em: 5 jul. 2009 (adaptado).

<strong>Texto II</strong>  
Barbarismo é vício que se comete na escritura de cada uma das partes da construção ou na pronunciação. E em nenhuma parte da Terra se comete mais essa figura da pronunciação que nestes reinos, por causa das muitas nações que trouxemos ao jugo do nosso serviço. Porque bem como os Gregos e Romanos haviam por <em>bárbaras</em> todas as outras nações estranhas a eles, por não poderem formar sua linguagem, assim nós podemos dizer que as nações de África, Guiné, Ásia, Brasil barbarizam quando querem imitar a nossa.

BARROS, J. <strong>Gramática da língua portuguesa.</strong> Porto: Porto Editora, 1957 (adaptado).';
UPDATE questions SET conteudo = 'Literatura', tags = 'Contemporânea', dificuldade = 'dificil' WHERE enunciado = '<strong>Texto I</strong>  
\[…\] já foi o tempo em que via a convivência como viável, só exigindo deste bem comum, piedosamente, o meu quinhão, já foi o tempo em que consentia num contrato, deixando muitas coisas de fora sem ceder contudo no que me era vital, já foi o tempo em que reconhecia a existência escandalosa de imaginados valores, coluna vertebral de toda ‘ordem’; mas não tive sequer o sopro necessário, e, negado o respiro, me foi imposto o sufoco; é esta consciência que me libera, é ela hoje que me empurra, são outras agora minhas preocupações, é hoje outro o meu universo de problemas; num mundo estapafúrdio — definitivamente fora de foco — cedo ou tarde tudo acaba se reduzindo a um ponto de vista, e você que vive paparicando as ciências humanas, nem suspeita que paparica uma piada: impossível ordenar o mundo dos valores, ninguém arruma a casa do capeta; me recuso pois a pensar naquilo em que não mais acredito, seja o amor, a amizade, a família, a igreja, a humanidade; me lixo com tudo isso! me apavora ainda a existência, mas não tenho medo de ficar sozinho, foi conscientemente que escolhi o exílio, me bastando hoje o cinismo dos grandes indiferentes \[…\].

NASSAR, R. <strong>Um copo de cólera</strong>. São Paulo:  
Companhia das Letras, 1992.

<strong>Texto II</strong>  
Raduan Nassar lançou a novela Um Copo de Cólera em 1978, fervilhante narrativa de um confronto verbal entre amantes, em que a fúria das palavras cortantes se estilhaçava no ar. O embate conjugal ecoava o autoritário discurso do poder e da submissão de um Brasil que vivia sob o jugo da ditadura militar.

COMODO, R. Um silêncio inquietante. <strong>IstoÉ.</strong> Disponível em:  
http://www.terra.com.br. Acesso em: 15 jul. 2009.';
UPDATE questions SET conteudo = 'Literatura', tags = 'Contemporânea', dificuldade = 'dificil' WHERE enunciado = '<strong>Texto I</strong>  
\[…\] já foi o tempo em que via a convivência como viável, só exigindo deste bem comum, piedosamente, o meu quinhão, já foi o tempo em que consentia num contrato, deixando muitas coisas de fora sem ceder contudo no que me era vital, já foi o tempo em que reconhecia a existência escandalosa de imaginados valores, coluna vertebral de toda ‘ordem’; mas não tive sequer o sopro necessário, e, negado o respiro, me foi imposto o sufoco; é esta consciência que me libera, é ela hoje que me empurra, são outras agora minhas preocupações, é hoje outro o meu universo de problemas; num mundo estapafúrdio — definitivamente fora de foco — cedo ou tarde tudo acaba se reduzindo a um ponto de vista, e você que vive paparicando as ciências humanas, nem suspeita que paparica uma piada: impossível ordenar o mundo dos valores, ninguém arruma a casa do capeta; me recuso pois a pensar naquilo em que não mais acredito, seja o amor, a amizade, a família, a igreja, a humanidade; me lixo com tudo isso! me apavora ainda a existência, mas não tenho medo de ficar sozinho, foi conscientemente que escolhi o exílio, me bastando hoje o cinismo dos grandes indiferentes \[…\].

NASSAR, R. <strong>Um copo de cólera</strong>. São Paulo:  
Companhia das Letras, 1992.

<strong>Texto II</strong>  
Raduan Nassar lançou a novela Um Copo de Cólera em 1978, fervilhante narrativa de um confronto verbal entre amantes, em que a fúria das palavras cortantes se estilhaçava no ar. O embate conjugal ecoava o autoritário discurso do poder e da submissão de um Brasil que vivia sob o jugo da ditadura militar.

COMODO, R. Um silêncio inquietante. <strong>IstoÉ.</strong> Disponível em:  
http://www.terra.com.br. Acesso em: 15 jul. 2009.';
UPDATE questions SET conteudo = 'Crítica Social, Cultural e Artística', tags = NULL, dificuldade = 'medio' WHERE enunciado = 'Nunca se falou e se preocupou tanto com o corpo como nos dias atuais. É comum ouvirmos anúncios de uma nova academia de ginástica, de uma nova forma de dieta, de uma nova técnica de autoconhecimento e outras práticas de saúde alternativa, em síntese, vivemos nos últimos anos a redescoberta do prazer, voltando nossas atenções ao nosso próprio corpo. Essa valorização do prazer individualizante se estrutura em um verdadeiro culto ao corpo, em analogia a uma religião, assistimos hoje ao surgimento de novo universo: a corpolatria.

CODO, W.; SENNE, W. <strong>O que é corpo(latria)</strong>. Coleção  
Primeiros Passos. Brasiliense, 1985 (adaptado).';
UPDATE questions SET conteudo = 'Literatura', tags = 'Modernismo', dificuldade = 'medio' WHERE enunciado = '<strong>Confidência do Itabirano</strong>

Alguns anos vivi em Itabira.  
Principalmente nasci em Itabira.  
Por isso sou triste, orgulhoso: de ferro.  
Noventa por cento de ferro nas calçadas.  
Oitenta por cento de ferro nas almas.  
E esse alheamento do que na vida é porosidade e  
  \[comunicação.

A vontade de amar, que me paralisa o trabalho,  
vem de Itabira, de suas noites brancas, sem mulheres e  
  \[sem horizontes.  
E o hábito de sofrer, que tanto me diverte,  
é doce herança itabirana.

De Itabira trouxe prendas diversas que ora te ofereço:  
esta pedra de ferro, futuro aço do Brasil,  
este São Benedito do velho santeiro Alfredo Duval;  
este couro de anta, estendido no sofá da sala de visitas;  
este orgulho, esta cabeça baixa…

Tive ouro, tive gado, tive fazendas.  
Hoje sou funcionário público.  
Itabira é apenas uma fotografia na parede.  
Mas como dói!

ANDRADE, C. D. <strong>Poesia completa.</strong>  
Rio de Janeiro: Nova Aguilar, 2003.';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Razão e proporção', dificuldade = 'medio' WHERE enunciado = 'Dados da Associação Nacional de Empresas de Transportes Urbanos (ANTU) mostram que o número de passageiros transportados mensalmente nas principais regiões metropolitanas do país vem caindo sistematicamente. Eram 476,7 milhões de passageiros em 1995, e esse número caiu para 321,9 milhões em abril de 2001. Nesse período, o tamanho da frota de veículos mudou pouco, tendo no final de 2008 praticamente o mesmo tamanho que tinha em 2001.  
O gráfico a seguir mostra um índice de produtividade utilizado pelas empresas do setor, que é a razão entre o total de passageiros transportados por dia e o tamanho da frota de veículos.

<img src="https://enem.dev/2009/questions/136/dcd1ac1c-61ef-4937-bc83-ee7b4a18f667.jpg">';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Regra de 3', dificuldade = 'medio' WHERE enunciado = 'O mapa ao lado representa um bairro de determinada cidade, no qual as flechas indicam o sentido das mãos do tráfego. Sabe-se que esse bairro foi planejado e que cada quadra representada na figura é um terreno quadrado, de lado igual a 200 metros.

<img src="https://enem.dev/2009/questions/137/d56b6567-20da-46f3-92e0-42b14796b37b.jpg">';
UPDATE questions SET conteudo = 'Conjuntos e funções', tags = 'Equação, inequação e função exponenciais', dificuldade = 'dificil' WHERE enunciado = 'A população mundial está ficando mais velha, os índices de natalidade diminuíram e a expectativa de vida aumentou. No gráfico seguinte, são apresentados dados obtidos por pesquisa realizada pela Organização das Nações Unidas (ONU), a respeito da quantidade de pessoas com 60 anos ou mais em todo o mundo. Os números da coluna da direita representam as faixas percentuais. Por exemplo, em 1950 havia 95 milhões de pessoas com 60 anos ou mais nos países desenvolvidos, número entre 10% e 15% da população total nos países desenvolvidos.

<img src="https://enem.dev/2009/questions/138/2f19ef3b-7481-42c2-9c55-03664846dacc.jpg">

Suponha que o modelo exponencial y = 363e0,03x, em que x = 0 corresponde ao ano 2000, x = 1 corresponde ao ano 2001, e assim sucessivamente, e que y é a população em milhões de habitantes no ano x, seja usado para estimar essa população com 60 anos ou mais de idade nos países em desenvolvimento entre 2010 e 2050.';
UPDATE questions SET conteudo = 'Probabilidade', tags = 'Probabilidade de eventos', dificuldade = 'medio' WHERE enunciado = 'A população mundial está ficando mais velha, os índices de natalidade diminuíram e a expectativa de vida aumentou. No gráfico seguinte, são apresentados dados obtidos por pesquisa realizada pela Organização das Nações Unidas (ONU), a respeito da quantidade de pessoas com 60 anos ou mais em todo o mundo. Os números da coluna da direita representam as faixas percentuais. Por exemplo, em 1950 havia 95 milhões de pessoas com 60 anos ou mais nos países desenvolvidos, número entre 10% e 15% da população total nos países desenvolvidos.

<img src="https://enem.dev/2009/questions/139/ce6a3e69-a428-4ce0-9247-80452dcdca20.jpg">';
UPDATE questions SET conteudo = 'Geometria plana', tags = 'Retângulos', dificuldade = 'dificil' WHERE enunciado = 'O governo cedeu terrenos para que famílias construíssem suas residências com a condição de que no mínimo 94% da área do terreno fosse mantida como área de preservação ambiental. Ao receber o terreno retangular ABCD, em que AB= BC/2 , Antônio demarcou uma área quadrada no vértice A, para a construção de sua residência, de acordo com o desenho, no qual AE = AB/5 é lado do quadrado.

<img src="https://enem.dev/2009/questions/140/ef5fc6bc-3de0-4ee7-ae4c-cdbca574c187.jpg">';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Regra de 3', dificuldade = 'facil' WHERE enunciado = 'Uma resolução do Conselho Nacional de Política Energética (CNPE) estabeleceu a obrigatoriedade de adição de biodiesel ao óleo diesel comercializado nos postos. A exigência é que, a partir de 1.º de julho de 2009, 4% do volume da mistura final seja formada por biodiesel. Até junho de 2009, esse percentual era de 3%. Essa medida estimula a demanda de biodiesel, bem como possibilita a redução da importação de dísel de petróleo.

Disponível em: http://www1.folha.uol.com.br.  
Acesso em: 12 jul. 2009 (adaptado).';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Interpretação de tabelas', dificuldade = 'medio' WHERE enunciado = 'A suspeita de que haveria uma relação causal entre tabagismo e câncer de pulmão foi levantada pela primeira vez a partir de observações clínicas. Para testar essa possível associação, foram conduzidos inúmeros estudos epidemiológicos. Dentre esses, houve o estudo do número de casos de câncer em relação ao número de cigarros consumidos por dia, cujos resultados são mostrados no gráfico a seguir.

<img src="https://enem.dev/2009/questions/142/c56fbd08-b377-40bd-831c-b571ed7638fe.jpg">';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Escalas numéricas e porcentagem', dificuldade = 'facil' WHERE enunciado = 'O gráfico a seguir mostra a evolução, de abril de 2008 a maio de 2009, da população economicamente ativa para seis Regiões Metropolitanas pesquisadas.

<img src="https://enem.dev/2009/questions/143/d9c2ead9-7b0d-4ba9-bf7d-53d4e3024558.jpg">

Disponível em: www.ibge.gov.br.';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Frações', dificuldade = 'medio' WHERE enunciado = 'A música e a matemática se encontram na representação dos tempos das notas musicais, conforme a figura seguinte.

<img src="https://enem.dev/2009/questions/144/e592d2d8-7aca-4cb8-8a1c-3d01b64706a6.jpg">

Um compasso é uma unidade musical composta por determinada quantidade de notas musicais em que a soma das durações coincide com a fração indicada como fórmula do compasso. Por exemplo, se a fórmula de compasso for 1/2 , poderia ter um compasso ou com duas semínimas ou uma mínima ou quatro colcheias, sendo possível a combinação de diferentes figuras.';
UPDATE questions SET conteudo = 'Probabilidade', tags = 'Probabilidade condicional e distribuição binomial', dificuldade = 'dificil' WHERE enunciado = 'O controle de qualidade de uma empresa fabricante de telefones celulares aponta que a probabilidade de um aparelho de determinado modelo apresentar defeito de fabricação é de 0,2%. Se uma loja acaba de vender 4 aparelhos desse modelo para um cliente, qual é a probabilidade de esse cliente sair da loja com exatamente dois aparelhos defeituosos?';
UPDATE questions SET conteudo = 'Sequências', tags = 'Progressão aritmética', dificuldade = 'medio' WHERE enunciado = 'Uma pousada oferece pacotes promocionais para atrair casais a se hospedarem por até oito dias. A hospedagem seria em apartamento de luxo e, nos três primeiros dias, a diária custaria R$ 150,00, preço da diária fora da promoção. Nos três dias seguintes, seria aplicada uma redução no valor da diária, cuja taxa média de variação, a cada dia, seria de R$ 20,00. Nos dois dias restantes, seria mantido o preço do sexto dia. Nessas condições, um modelo para a promoção idealizada é apresentado no gráfico a seguir, no qual o valor da diária é função do tempo medido em número de dias.

<img src="https://enem.dev/2009/questions/146/6e823a1c-778f-4d1a-89e6-06619fba287a.jpg">';
UPDATE questions SET conteudo = 'Geometria plana', tags = 'Polígonos', dificuldade = 'facil' WHERE enunciado = 'As figuras a seguir exibem um trecho de um quebra-cabeças que está sendo montado. Observe que as peças são quadradas e há 8 peças no tabuleiro da figura A e 8 peças no tabuleiro da figura B. As peças são retiradas do tabuleiro da figura B e colocadas no tabuleiro da figura A na posição correta, isto é, de modo a completar os desenhos.

<img src="https://enem.dev/2009/questions/147/2540b2c3-868a-4e6d-bf25-edf78475b995.jpg">

<img src="https://enem.dev/2009/questions/147/ce96a139-05bf-4b25-a3fc-eab46adf80f1.jpg">';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Razão e proporção', dificuldade = 'medio' WHERE enunciado = 'A tabela mostra alguns dados da emissão de dióxido de carbono de uma fábrica, em função do número de toneladas produzidas.

<img src="https://enem.dev/2009/questions/148/052af6e6-63f3-43e2-be36-96d0f5a48ab4.jpg">';
UPDATE questions SET conteudo = 'Geometria plana', tags = 'Circunferência e círculo', dificuldade = 'facil' WHERE enunciado = 'Em Florença, Itália, na Igreja de Santa Croce, é possível encontrar um portão em que aparecem os anéis de Borromeo. Alguns historiadores acreditavam que os círculos representavam as três artes: escultura, pintura e arquitetura, pois elas eram tão próximas quanto inseparáveis.

<img src="https://enem.dev/2009/questions/149/87fc20be-0d1a-4508-b804-bf58ba86e918.jpg">';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Interpretação de tabelas', dificuldade = 'medio' WHERE enunciado = 'Brasil e França têm relações comerciais há mais de 200 anos. Enquanto a França é a 5ª nação mais rica do planeta, o Brasil é a 10ª, e ambas se destacam na economia mundial. No entanto, devido a uma série de restrições, o comércio entre esses dois países ainda não é adequadamente explorado, como mostra a tabela seguinte, referente ao período 2003-2007.

<img src="https://enem.dev/2009/questions/150/345210ee-8d51-4c8d-b6ca-05541e682160.jpg">';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Equação do 1º grau e sistema de equações do 1º grau', dificuldade = 'medio' WHERE enunciado = 'Um grupo de 50 pessoas fez um orçamento inicial para organizar uma festa, que seria dividido entre elas em cotas iguais. Verificou-se ao final que, para arcar com todas as despesas, faltavam R$ 510,00, e que 5 novas pessoas haviam ingressado no grupo. No acerto foi decidido que a despesa total seria dividida em partes iguais pelas 55 pessoas. Quem não havia ainda contribuído pagaria a sua parte, e cada uma das 50 pessoas do grupo inicial deveria contribuir com mais R$ 7,00.';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Potência de 10 e notação científica', dificuldade = 'dificil' WHERE enunciado = '<strong>Técnicos concluem mapeamento do aquífero Guarani</strong>

O aquífero Guarani localiza-se no subterrâneo dos territórios da Argentina, Brasil, Paraguai e Uruguai, com extensão total de 1.200.000 quilômetros quadrados, dos quais 840.000 quilômetros quadrados estão no Brasil. O aquífero armazena cerca de 30 mil quilômetros cúbicos de água e é considerado um dos maiores do mundo.  
Na maioria das vezes em que são feitas referências à água, são usadas as unidades metro cúbico e litro, e não as unidades já descritas. A Companhia de Saneamento Básico do Estado de São Paulo (SABESP) divulgou, por exemplo, um novo reservatório cuja capacidade de armazenagem é de 20 milhões de litros.

Disponível em: http://noticias.terra.com.br. Acesso em: 10 jul. 2009 (adaptado).';
UPDATE questions SET conteudo = 'Geometria espacial', tags = 'Prismas', dificuldade = 'dificil' WHERE enunciado = 'Suponha que, na escultura do artista Emanoel Araújo, mostrada na figura a seguir, todos os prismas numerados em algarismos romanos são retos, com bases triangulares, e que as faces laterais do poliedro II são perpendiculares à sua própria face superior, que, por sua vez, é um triângulo congruente ao triângulo base dos prismas. Além disso, considere que os prismas I e III são perpendiculares ao prisma IV e ao poliedro II.

<img src="https://enem.dev/2009/questions/153/0aaaf8f3-e87d-435c-901f-40781e411de9.jpg">';
UPDATE questions SET conteudo = 'Geometria plana', tags = 'Semelhança de polígonos', dificuldade = 'medio' WHERE enunciado = 'A rampa de um hospital tem na sua parte mais elevada uma altura de 2,2 metros. Um paciente ao caminhar sobre a rampa percebe que se deslocou 3,2 metros e alcançou uma altura de 0,8 metro.';
UPDATE questions SET conteudo = 'Conjuntos e funções', tags = 'Função do 2º grau', dificuldade = 'dificil' WHERE enunciado = 'Um posto de combustível vende 10.000 litros de álcool por dia a R$ 1,50 cada litro. Seu proprietário percebeu que, para cada centavo de desconto que  concedia por litro, eram vendidos 100 litros a mais por dia. Por exemplo, no dia em que o preço do álcool foi R$ 1,48, foram vendidos 10.200 litros.';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Estudo prático de matemática básica', dificuldade = 'dificil' WHERE enunciado = 'Para cada indivíduo, a sua inscrição no Cadastro de Pessoas Físicas (CPF) é composto por um número de 9 algarismos e outro número de 2 algarismos, na forma <em>d1</em> e <em>d2</em>, em que os dígitos <em>d1</em> e <em>d2</em> são denominados dígitos verificadores. Os dígitos verificadores são calculados, a partir da esquerda, da seguinte maneira: os 9 primeiros algarismos são multiplicados pela sequência 10, 9, 8, 7, 6, 5, 4, 3, 2 (o primeiro por 10, o segundo por 9, e assim sucessivamente); em seguida, calcula-se o resto <em>r</em> da divisão da soma dos resultados das multiplicações por 11, e se esse resto <em>r</em> for 0 ou 1, <em>d1</em> é zero, caso contrário <em>d1</em> = (11 – r). O dígito <em>d2</em> é calculado pela mesma regra, na qual os números a serem multiplicados pela sequência dada são contados a partir do segundo algarismo, sendo <em>d1</em> o último algarismo, isto é, <em>d2</em> é zero se o resto <em>s</em> da divisão por 11 das somas das multiplicações for 0 ou 1, caso contrário, <em>d2</em> = (11 – <em>s</em>).';
UPDATE questions SET conteudo = 'Geometria espacial', tags = 'Esfera', dificuldade = 'dificil' WHERE enunciado = 'Uma empresa que fabrica esferas de aço, de 6 cm de raio, utiliza caixas de madeira, na forma de um cubo, para transportá-las.';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Escalas numéricas e porcentagem', dificuldade = 'dificil' WHERE enunciado = 'A figura a seguir mostra as medidas reais de uma aeronave que será fabricada para utilização por companhias de transporte aéreo. Um engenheiro precisa fazer o desenho desse avião em escala de 1:150.

<img src="https://enem.dev/2009/questions/158/ee2af503-e5d1-45f8-b7f1-372e3cec5e11.jpg">';
UPDATE questions SET conteudo = 'Conjuntos e funções', tags = 'Função do 1º grau', dificuldade = 'medio' WHERE enunciado = 'Um experimento consiste em colocar certa quantidade de bolas de vidro idênticas em um copo com água até certo nível e medir o nível da água, conforme ilustrado na figura a seguir. Como resultado do experimento, concluiu-se que o nível da água é função do número de bolas de vidro que são colocadas dentro do copo.

<img src="https://enem.dev/2009/questions/159/c49b9a82-ca97-42ec-89a8-0d08a9c8abd3.jpg">

O quadro a seguir mostra alguns resultados do experimento realizado.

<img src="https://enem.dev/2009/questions/159/09fc439a-a96c-466c-a8a7-0928313480ae.jpg">';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Regra de 3', dificuldade = 'dificil' WHERE enunciado = 'Uma cooperativa de colheita propôs a um fazendeiro um contrato de trabalho nos seguintes termos: a cooperativa forneceria 12 trabalhadores e 4 máquinas, em um regime de trabalho de 6 horas diárias, capazes de colher 20 hectares de milho por dia, ao custo de R$ 10,00 por trabalhador por dia de trabalho, e R$ 1.000,00 pelo aluguel diário de cada máquina. O fazendeiro argumentou que fecharia contrato se a cooperativa colhesse 180 hectares de milho em 6 dias, com gasto inferior a R$ 25.000,00.';
UPDATE questions SET conteudo = 'Estatística', tags = 'Medidas de centralidade', dificuldade = 'medio' WHERE enunciado = 'Suponha que a etapa final de uma gincana escolar consista em um desafio de conhecimentos. Cada equipe escolheria 10 alunos para realizar uma prova objetiva, e a pontuação da equipe seria dada pela mediana das notas obtidas pelos alunos. As provas valiam, no máximo, 10 pontos cada. Ao final, a vencedora foi a equipe Ômega, com 7,8 pontos, seguida pela equipe Delta, com 7,6 pontos. Um dos alunos da equipe Gama, a qual ficou na terceira e última colocação, não pôde comparecer, tendo recebido nota zero na prova. As notas obtidas pelos 10 alunos da equipe Gama foram 10; 6,5; 8; 10; 7; 6,5; 7; 8; 6; 0.';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Regra de 3', dificuldade = 'dificil' WHERE enunciado = 'Uma escola lançou uma campanha para seus alunos arrecadarem, durante 30 dias, alimentos não perecíveis para doar a uma comunidade carente da região. Vinte alunos aceitaram a tarefa e nos primeiros 10 dias trabalharam 3 horas diárias, arrecadando 12 kg de alimentos por dia. Animados com os resultados, 30 novos alunos somaram-se ao grupo, e passaram a trabalhar 4 horas por dia nos dias seguintes até o término da campanha.';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Regra de 3', dificuldade = 'dificil' WHERE enunciado = 'Segundo as regras da Fórmula 1, o peso mínimo do carro, de tanque vazio, com o piloto, é de 605 kg, e a gasolina deve ter densidade entre 725 e 780 gramas por litro. Entre os circuitos nos quais ocorrem competições dessa categoria, o mais longo é <em>Spa-Francorchamps</em>, na Bélgica, cujo traçado tem 7 km de extensão. O consumo médio de um carro da Fórmula 1 é de 75 litros para cada 100 km.';
UPDATE questions SET conteudo = 'Geometria plana', tags = 'Circunferência e círculo', dificuldade = 'dificil' WHERE enunciado = 'Ao morrer, o pai de João, Pedro e José deixou como herança um terreno retangular de 3 km x 2 km que contém uma área de extração de ouro delimitada por um quarto de círculo de raio 1 km a partir do canto inferior esquerdo da propriedade. Dado o maior valor da área de extração de ouro, os irmãos acordaram em repartir a propriedade de modo que cada um ficasse com a terça parte da área de extração, conforme mostra a figura.

<img src="https://enem.dev/2009/questions/164/fbf84d66-498d-4521-8b27-9a164c60237d.jpg">';
UPDATE questions SET conteudo = 'Análise combinatória', tags = 'Combinação', dificuldade = 'medio' WHERE enunciado = 'Doze times se inscreveram em um torneio de futebol amador. O jogo de abertura do torneio foi escolhido da seguinte forma: primeiro foram sorteados 4 times para compor o Grupo A. Em seguida, entre os times do Grupo A, foram sorteados 2 times para realizar o jogo de abertura do torneio, sendo que o primeiro deles jogaria em seu próprio campo, e o segundo seria o time visitante.';
UPDATE questions SET conteudo = 'Geometria plana', tags = 'Axiomas, ângulos e teorema de Tales', dificuldade = 'dificil' WHERE enunciado = 'Rotas aéreas são como pontes que ligam cidades, estados ou países. O mapa a seguir mostra os estados brasileiros e a localização de algumas capitais identificadas pelos números. Considere que a direção seguida por um avião AI que partiu de Brasília – DF, sem escalas, para Belém, no Pará, seja um segmento de reta com extremidades em DF e em 4.

<img src="https://enem.dev/2009/questions/166/f22c3fd9-901b-449e-8864-b9cf7c0cc24a.jpg">';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Razão e proporção', dificuldade = 'facil' WHERE enunciado = 'O quadro apresenta informações da área aproximada de cada bioma brasileiro.

<img src="https://enem.dev/2009/questions/167/2e45ce65-e1cb-4d1c-975d-1a4c2feade5f.jpg">

É comum em conversas informais, ou mesmo em noticiários, o uso de múltiplos da área de um campo de futebol (com as medidas de 120 m x 90 m) para auxiliar a visualização de áreas consideradas extensas';
UPDATE questions SET conteudo = 'Estatística', tags = 'Medidas de centralidade', dificuldade = 'facil' WHERE enunciado = 'Na tabela, são apresentados dados da cotação mensal do ovo extra branco vendido no atacado, em Brasília, em reais, por caixa de 30 dúzias de ovos, em alguns meses dos anos 2007 e 2008.

<img src="https://enem.dev/2009/questions/168/f683544b-94d1-456c-bdfb-f2e964881776.jpg">';
UPDATE questions SET conteudo = 'Geometria plana', tags = 'Quadriláteros notáveis', dificuldade = 'dificil' WHERE enunciado = 'A vazão do rio Tietê, em São Paulo, constitui preocupação constante nos períodos chuvosos. Em alguns trechos, são construídas canaletas para controlar o fluxo de água. Uma dessas canaletas, cujo corte vertical determina a forma de um trapézio isósceles, tem as medidas especificadas na figura I. Neste caso, a vazão da água é de 1.050 m³/s. O cálculo da vazão, Q em m³/s, envolve o produto da área A do setor transversal (por onde passa a água), em m², pela velocidade da água no local, v, em m/s, ou seja, Q = Av.  
Planeja-se uma reforma na canaleta, com as dimensões especificadas na figura II, para evitar a ocorrência de enchentes.

<img src="https://enem.dev/2009/questions/169/ff2b8876-8f76-444b-b4d9-15556da637ec.jpg">';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Potência de 10 e notação científica', dificuldade = 'dificil' WHERE enunciado = 'A resolução das câmeras digitais modernas é dada em <em>megapixels</em>, unidade de medida que representa um milhão de pontos. As informações sobre cada um desses pontos são armazenadas, em geral, em 3 <em>bytes</em>. Porém, para evitar que as imagens ocupem muito espaço, elas são submetidas a algoritmos de compressão, que reduzem em até 95% a quantidade de <em>bytes</em> necessários  
para armazená-las. Considere 1 KB = 1.000 bytes, 1 MB = 1.000 KB, 1 GB = 1.000 MB.';
UPDATE questions SET conteudo = 'Probabilidade', tags = 'Probabilidade de eventos', dificuldade = 'dificil' WHERE enunciado = 'A população brasileira sabe, pelo menos intuitivamente, que a probabilidade de acertar as seis dezenas da mega sena não é zero, mas é quase. Mesmo assim, milhões de pessoas são atraídas por essa loteria, especialmente quando o prêmio se acumula em valores altos. Até junho de 2009, cada aposta de seis dezenas, pertencentes ao conjunto {01, 02, 03, …, 59, 60}, custava R$ 1,50.

Disponível em: www.caixa.gov.br. Acesso em: 7 jul. 2009.

Considere que uma pessoa decida apostar exatamente R$ 126,00 e que esteja mais interessada em acertar apenas cinco das seis dezenas da mega sena, justamente pela dificuldade desta última.';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Expressões numéricas', dificuldade = 'medio' WHERE enunciado = 'Nos últimos anos, o volume de petróleo exportado pelo Brasil tem mostrado expressiva tendência de crescimento, ultrapassando as importações em 2008. Entretanto, apesar de as importações terem se mantido praticamente no mesmo patamar desde 2001, os recursos gerados com as exportações ainda são inferiores àqueles despendidos com as importações, uma vez que o preço médio por metro cúbico do petróleo importado é superior ao do petróleo nacional. Nos primeiros cinco meses de 2009, foram gastos 2,84 bilhões de dólares com importações e gerada uma receita de 2,24 bilhões de dólares com as exportações. O preço médio por metro cúbico em maio de 2009 foi de 340 dólares para o petróleo importado e de 230 dólares para o petróleo exportado. O quadro a seguir mostra os dados consolidados de 2001 a 2008 e dos primeiros cinco meses de 2009.

<img src="https://enem.dev/2009/questions/172/5f549378-e9d4-4d17-9950-19a0f32f95b7.jpg">

Considere que as importações e exportações de petróleo de junho a dezembro de 2009 sejam iguais a 7/5 das  
importações e exportações, respectivamente, ocorridas de janeiro a maio de 2009.';
UPDATE questions SET conteudo = 'Geometria espacial', tags = 'Troncos, inscrição e circunscrição de sólidos', dificuldade = 'dificil' WHERE enunciado = 'Uma fábrica produz velas de parafina em forma de pirâmide quadrangular regular com 19 cm de altura e 6 cm de aresta da base. Essas velas são formadas por 4 blocos de mesma altura — 3 troncos de pirâmide de bases paralelas e 1 pirâmide na parte superior —, espaçados de 1 cm entre eles, sendo que a base superior de cada bloco é igual à base inferior do bloco sobreposto, com uma haste de ferro passando pelo centro de cada bloco, unindo-os, conforme a figura.

<img src="https://enem.dev/2009/questions/173/e9b7219c-4c2a-459d-a1ce-d4e7a3ec2c25.jpg">';
UPDATE questions SET conteudo = 'Trigonometria', tags = 'Seno e cosseno', dificuldade = 'dificil' WHERE enunciado = 'Considere um ponto P em uma circunferência de raio r no plano cartesiano. Seja Q a projeção ortogonal de P sobre o eixo x, como mostra a figura, e suponha que o ponto P percorra, no sentido anti-horário, uma distância d ≤ r sobre a circunferência.

<img src="https://enem.dev/2009/questions/174/29dd5a77-8236-4be7-bdf2-fe2a3bfc482c.jpg">';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Equação do 1º grau e sistema de equações do 1º grau', dificuldade = 'dificil' WHERE enunciado = 'O Indicador do CadÚnico (ICadÚnico), que compõe o cálculo do Índice de Gestão Descentralizada do Programa Bolsa Família (IGD), é obtido por meio da <strong>média aritmética</strong> entre a taxa de cobertura qualificada de cadastros (TC) e a taxa de atualização de cadastros (TA), em que, <em>TC= NV/NF, TA= NA/NV, NV</em> é o número de cadastros domiciliares válidos no perfil do CadÚnico, <em>NF</em> é o número de famílias estimadas como público alvo do CadÚnico e <em>NA</em> é o número de cadastros domiciliares atualizados no perfil do CadÚnico.

<strong>Portaria n° 148 de 27 de abril de 2006</strong> (adaptado).';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Estudo prático de matemática básica', dificuldade = 'medio' WHERE enunciado = 'Joana frequenta uma academia de ginástica onde faz exercícios de musculação. O programa de Joana requer que ela faça 3 séries de exercícios em 6 aparelhos diferentes, gastando 30 segundos em cada série. No aquecimento, ela caminha durante 10 minutos na esteira e descansa durante 60 segundos para começar o primeiro exercício no primeiro aparelho. Entre uma série e outra, assim como ao mudar de aparelho, Joana descansa por 60 segundos.';
UPDATE questions SET conteudo = 'Geometria espacial', tags = 'Pirâmides', dificuldade = 'dificil' WHERE enunciado = 'Um artesão construiu peças de artesanato interceptando uma pirâmide de base quadrada com um plano. Após fazer um estudo das diferentes peças que poderia obter, ele concluiu que uma delas poderia ter uma das faces pentagonal.';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Escalas numéricas e porcentagem', dificuldade = 'medio' WHERE enunciado = 'João deve 12 parcelas de R$ 150,00 referentes ao cheque especial de seu banco e cinco parcelas de R$ 80,00 referentes ao cartão de crédito. O gerente do banco lhe ofereceu duas parcelas de desconto no cheque especial, caso João quitasse esta dívida imediatamente ou, na mesma condição, isto é, quitação imediata, com 25% de desconto na dívida do cartão. João também poderia renegociar suas dívidas em 18 parcelas mensais de R$ 125,00. Sabendo desses termos, José, amigo de João, ofereceu-lhe emprestar o dinheiro que julgasse necessário pelo tempo de 18 meses, com juros de 25% sobre o total emprestado.';
UPDATE questions SET conteudo = 'Matemática básica', tags = 'Razão e proporção', dificuldade = 'dificil' WHERE enunciado = 'A cisterna é um recipiente utilizado para armazenar água da chuva. Os principais critérios a serem observados para captação e armazenagem de água da chuva são: a demanda diária de água na propriedade; o índice médio de precipitação (chuva), por região, em cada período do ano; o tempo necessário para armazenagem; e a área de telhado necessária ou disponível para captação. Para fazer o cálculo do volume de uma cisterna, deve-se acrescentar um adicional relativo ao coeficiente de evaporação. Na dificuldade em se estabelecer um coeficiente confiável, a Empresa Brasileira de Pesquisa Agropecuária (EMBRAPA) sugere que sejam adicionados 10% ao volume calculado de água.

Desse modo, o volume, em m³, de uma cisterna é calculado por Vc = Vd × Ndia, em que Vd = volume de demanda da água diária (m³), Ndia = número de dias de armazenagem, e este resultado deve ser acrescido de 10%.

Para melhorar a qualidade da água, recomenda-se que a captação seja feita somente nos telhados das edificações.  
Considerando que a precipitação de chuva de 1 mm sobre uma área de 1 m²  
produz 1 litro de água, pode-se calcular a área de um telhado a fim de atender a  
necessidade de armazenagem da seguinte maneira: área do telhado (em m²) = volume da cisterna (em litros)/precipitação.

Disponível em: www.cnpsa.embrapa.br.  
Acesso em: 8 jun. 2009 (adaptado).';
UPDATE questions SET conteudo = 'Probabilidade', tags = 'Probabilidade condicional e distribuição binomial', dificuldade = 'dificil' WHERE enunciado = 'Um médico está estudando um novo medicamento que combate um tipo de câncer em estágios avançados. Porém, devido ao forte efeito dos seus componentes, a cada dose administrada há uma chance de 10% de que o paciente sofra algum dos efeitos colaterais observados no estudo, tais como dores de cabeça, vômitos ou mesmo agravamento dos sintomas da doença. O médico oferece tratamentos compostos por 3, 4, 6, 8 ou 10 doses do medicamento, de acordo com o risco que o paciente pretende assumir.';

commit;

// Artigos/notícias do site. Cada um vira uma página em /noticias/[slug].
// Conteúdo editorial do escritório — substitua/adicione livremente aqui.
export type Artigo = {
  slug: string;
  tag: string;
  title: string;
  data: string; // exibição, ex.: "Setembro de 2024"
  excerpt: string;
  corpo: string[]; // parágrafos
  destaque?: boolean;
};

export const ARTIGOS: Artigo[] = [
  {
    slug: "prevencao-trabalhista-compensa",
    tag: "Trabalhista",
    title:
      "Decisões pequenas, passivos grandes: por que a prevenção trabalhista compensa",
    data: "Julho de 2026",
    excerpt:
      "Uma contratação mal feita ou um desligamento mal conduzido raramente parecem graves no começo — mas costumam reaparecer como processos caros. Entenda como antecipar esses riscos.",
    destaque: true,
    corpo: [
      "No dia a dia da empresa, as decisões trabalhistas mais arriscadas quase nunca chegam com aviso. Uma contratação sem o enquadramento correto, um cargo de confiança que na prática não existe, horas extras que não são registradas, um desligamento conduzido no impulso — cada uma dessas situações parece pequena isoladamente, mas é exatamente delas que nascem os passivos mais caros.",
      "O ponto central da prevenção é documentar. Contrato claro, descrição de função condizente com a realidade, controle de jornada consistente e registros de advertências e feedbacks fazem toda a diferença quando uma reclamação chega. Numa audiência, vale muito mais um conjunto organizado de documentos do que a memória de quem participou dos fatos.",
      "Vale também revisar rotinas com regularidade: políticas de home office, uso de ferramentas próprias, metas e comissões, terceirização e a relação com prestadores. Pequenos ajustes preventivos custam pouco e evitam discussões que, no Judiciário, se arrastam por anos.",
      "A recomendação prática é simples: trate o jurídico trabalhista como parte da gestão, não como algo acionado só quando o problema já explodiu. Um acompanhamento próximo permite corrigir a rota antes de o risco virar processo.",
    ],
  },
  {
    slug: "contrato-empresarial-o-que-observar",
    tag: "Contratos",
    title: "O que observar antes de assinar um contrato empresarial",
    data: "Julho de 2026",
    excerpt:
      "Cláusulas de rescisão, garantias e responsabilidades: os pontos que mais geram conflito quando passam despercebidos.",
    corpo: [
      "Antes de assinar qualquer contrato empresarial, é fundamental entender não só o que a empresa ganha, mas o que ela assume. Objeto bem delimitado, prazos, obrigações de cada parte e forma de pagamento são o básico — mas os conflitos, na prática, costumam surgir nas cláusulas menos lidas.",
      "Três pontos merecem atenção especial: a rescisão (como o contrato termina, com que aviso e com quais custos), as garantias (o que assegura o cumprimento e o que acontece em caso de inadimplemento) e a responsabilidade (limites de indenização, multas e a quem cabe cada risco).",
      "Também é prudente verificar foro e forma de solução de conflitos, confidencialidade, cessão a terceiros e reajustes. Um contrato equilibrado protege a relação comercial e evita que uma divergência pontual se transforme em litígio.",
      "A revisão jurídica antes da assinatura é sempre mais barata do que a discussão depois. Vale a pena ler com calma — e com apoio técnico — o que se está prestes a assinar.",
    ],
  },
  {
    slug: "locacao-comercial-reduzir-riscos",
    tag: "Imobiliário",
    title: "Locação comercial: como reduzir riscos na sua empresa",
    data: "Julho de 2026",
    excerpt:
      "Garantias, prazos e renovação — o que a empresa precisa avaliar antes de ocupar um novo imóvel.",
    corpo: [
      "A locação de um imóvel comercial é uma decisão estratégica e, muitas vezes, um compromisso financeiro de anos. Por isso, antes de assinar, vale avaliar com cuidado as garantias exigidas, o prazo do contrato e as condições de reajuste.",
      "Um ponto que costuma passar despercebido é o direito à renovação. A chamada ação renovatória, prevista na Lei do Inquilinato, pode assegurar a permanência do negócio no ponto comercial, mas depende de requisitos e de prazos específicos que precisam ser observados desde o início.",
      "Também merecem atenção as benfeitorias (quem paga e o que fica ao fim do contrato), a destinação do imóvel, as regras de rescisão antecipada e a responsabilidade por tributos e taxas condominiais.",
      "Estruturar bem a locação desde a assinatura evita surpresas e protege um dos ativos mais sensíveis de muitos negócios: o ponto onde a empresa opera.",
    ],
  },
  {
    slug: "adequacao-cdc-prevencao-litigios",
    tag: "Consumidor",
    title: "Adequação ao CDC: prevenção que evita litígios",
    data: "Julho de 2026",
    excerpt:
      "Pequenos ajustes em práticas de atendimento e contratos podem reduzir significativamente as ações de consumo.",
    corpo: [
      "Empresas que lidam com o consumidor final estão sujeitas ao Código de Defesa do Consumidor, e boa parte das ações de consumo nasce de detalhes evitáveis: informação incompleta, cláusulas consideradas abusivas ou falhas no pós-venda.",
      "A adequação começa pela clareza. Preço, condições, prazos de entrega e política de trocas devem ser informados de forma transparente. Contratos de adesão precisam evitar cláusulas que desequilibrem excessivamente a relação, sob risco de serem anuladas.",
      "O atendimento também é peça-chave: registrar solicitações, responder dentro dos prazos e tratar reclamações com organização reduz o risco de que um desentendimento vire processo ou reclamação em órgãos de defesa do consumidor.",
      "Revisar periodicamente práticas e documentos à luz do CDC é uma medida preventiva de baixo custo e alto retorno para quem quer crescer com segurança.",
    ],
  },
  {
    slug: "recuperacao-de-credito-relacao-comercial",
    tag: "Civil",
    title: "Recuperação de crédito sem desgastar a relação comercial",
    data: "Julho de 2026",
    excerpt:
      "Estratégias jurídicas para cobrar com firmeza e preservar o relacionamento com o cliente.",
    corpo: [
      "Cobrar quem deve é legítimo — mas cobrar bem exige método. Uma recuperação de crédito bem conduzida busca o recebimento sem romper, sempre que possível, uma relação comercial que ainda interessa à empresa.",
      "O primeiro passo costuma ser a cobrança extrajudicial estruturada: notificação clara, proposta de acordo e prazos definidos. Muitas dívidas se resolvem nessa etapa, com menos custo e mais rapidez do que uma ação.",
      "Quando o diálogo não avança, existem instrumentos judiciais adequados a cada caso — da ação de cobrança à execução de título, quando há documento que comprove a dívida. A escolha certa acelera o resultado e evita esforço desperdiçado.",
      "O equilíbrio está em ser firme sem ser hostil: preservar a documentação, agir dentro dos prazos e manter o profissionalismo protege tanto o crédito quanto a reputação da empresa.",
    ],
  },
  {
    slug: "assessoria-juridica-recorrente",
    tag: "Preventivo",
    title: "Assessoria jurídica recorrente: quando faz sentido",
    data: "Julho de 2026",
    excerpt:
      "Por que empresas em crescimento ganham com um acompanhamento jurídico contínuo e próximo.",
    corpo: [
      "Muitas empresas só procuram um advogado quando o problema já está instalado. O acompanhamento jurídico recorrente inverte essa lógica: em vez de apagar incêndios, previne que eles comecem.",
      "Na prática, significa ter apoio para revisar contratos antes de assiná-los, orientar decisões societárias e trabalhistas, avaliar riscos de novos negócios e responder dúvidas do dia a dia com agilidade — antes que virem litígio.",
      "Para empresas em crescimento, essa proximidade traz previsibilidade. As decisões passam a considerar o risco jurídico desde o começo, e o custo de um acompanhamento contínuo costuma ser muito menor do que o de um único processo mal resolvido.",
      "Faz sentido quando o volume e a complexidade das decisões justificam ter o jurídico por perto — como um parceiro da gestão, e não apenas um recurso de emergência.",
    ],
  },
  {
    slug: "terceirizacao-responsabilidade-solidaria",
    tag: "Trabalhista",
    title: "Terceirização: responsabilidade solidária na prática",
    data: "Julho de 2026",
    excerpt:
      "Como estruturar a contratação de terceiros para evitar surpresas com responsabilidade subsidiária.",
    corpo: [
      "A terceirização é hoje uma realidade em praticamente todos os setores, mas contratar terceiros sem cuidado pode gerar responsabilidade da empresa tomadora por obrigações trabalhistas não cumpridas pela prestadora.",
      "Como regra, a empresa que contrata o serviço pode responder de forma subsidiária pelas verbas devidas aos trabalhadores da prestadora — ou seja, se a prestadora não paga, a conta pode chegar à tomadora. Por isso, a escolha e a fiscalização do parceiro importam.",
      "Boas práticas incluem contratar prestadoras idôneas, exigir a comprovação periódica do cumprimento das obrigações trabalhistas e previdenciárias, e formalizar tudo em contrato com cláusulas claras de responsabilidade.",
      "Estruturar a terceirização com esse cuidado permite aproveitar seus benefícios sem herdar passivos de terceiros.",
    ],
  },
  {
    slug: "clausula-penal-aplicabilidade",
    tag: "Contratos",
    title: "Cláusula penal: aplicabilidade",
    data: "Setembro de 2024",
    excerpt:
      "O papel da cláusula penal nos contratos: quando incide, seus limites e como funciona diante do inadimplemento e da mora.",
    corpo: [
      "A cláusula penal é a disposição contratual que fixa, previamente, a consequência do descumprimento de uma obrigação. Prevista no Código Civil, ela funciona como uma prefixação das perdas e danos e como um reforço ao cumprimento do que foi pactuado.",
      "Costuma-se distinguir a cláusula penal compensatória — ligada ao inadimplemento total da obrigação — da cláusula penal moratória, que incide sobre o atraso (a mora) ou o descumprimento de cláusula específica. Cada uma cumpre uma função e produz efeitos próprios.",
      "A lei impõe limites relevantes: o valor da penalidade não pode exceder o da obrigação principal, e o juiz pode reduzi-la de forma equitativa quando a obrigação tiver sido cumprida em parte ou quando o montante se mostrar manifestamente excessivo.",
      "Bem redigida, a cláusula penal traz previsibilidade e segurança ao contrato, deixando claro para as partes o custo do descumprimento. Mal calibrada, pode se tornar inexequível — daí a importância de dimensioná-la com técnica no momento da elaboração.",
    ],
  },
];

export function getArtigo(slug: string): Artigo | undefined {
  return ARTIGOS.find((a) => a.slug === slug);
}

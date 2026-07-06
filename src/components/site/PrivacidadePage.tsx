import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { PageHero, wrap, COR, SERIF, SANS } from "./ui";
import { LGPD, ou } from "@/lib/lgpd";

const h2Style = {
  fontFamily: SERIF,
  fontWeight: 500,
  fontSize: 26,
  color: COR.green,
  margin: "40px 0 12px",
} as const;
const pStyle = {
  fontSize: 16,
  lineHeight: 1.75,
  color: "#2a2c28",
  margin: "0 0 12px",
} as const;
const liStyle = { fontSize: 16, lineHeight: 1.7, color: "#2a2c28", marginBottom: 8 };

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={h2Style}>{titulo}</h2>
      {children}
    </section>
  );
}

export default function PrivacidadePage() {
  const dpoEmail = LGPD.encarregadoEmail;
  return (
    <div style={{ fontFamily: SANS, background: COR.cream, color: COR.ink }}>
      <SiteHeader active="" />
      <PageHero
        eyebrow="Privacidade"
        title="Política de Privacidade"
        subtitle="Como o Branco Advogados trata os seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)."
      />

      <div
        style={{ ...wrap, padding: "64px 40px 90px", maxWidth: 860 }}
        className="site-pad"
      >
        <p style={{ ...pStyle, color: COR.muted }}>
          Última atualização: {LGPD.atualizado}.
        </p>

        <Secao titulo="1. Quem é o controlador dos dados">
          <p style={pStyle}>
            O responsável pelo tratamento dos seus dados pessoais é{" "}
            <strong>{LGPD.controlador}</strong>, inscrito no CNPJ sob o nº{" "}
            {ou(LGPD.cnpj, "CNPJ a preencher")}, com sede em {LGPD.endereco}.
          </p>
          <p style={pStyle}>
            Contato: <a href={`mailto:${LGPD.contatoEmail}`} style={{ color: COR.green }}>{LGPD.contatoEmail}</a> · {LGPD.telefone}.
          </p>
        </Secao>

        <Secao titulo="2. Encarregado pelo tratamento de dados (DPO)">
          <p style={pStyle}>
            Nosso Encarregado (Data Protection Officer) é o canal de comunicação
            entre você, o escritório e a Autoridade Nacional de Proteção de Dados
            (ANPD):
          </p>
          <ul>
            <li style={liStyle}>
              <strong>Encarregado:</strong> {ou(LGPD.encarregadoNome, "nome a preencher")}
            </li>
            <li style={liStyle}>
              <strong>E-mail:</strong>{" "}
              <a href={`mailto:${dpoEmail}`} style={{ color: COR.green }}>
                {dpoEmail}
              </a>
            </li>
          </ul>
        </Secao>

        <Secao titulo="3. Quais dados coletamos">
          <ul>
            <li style={liStyle}>
              <strong>Dados de identificação e contato:</strong> nome, e-mail,
              telefone e mensagem que você envia pelo formulário de contato.
            </li>
            <li style={liStyle}>
              <strong>Dados relativos a processos e atendimento:</strong> quando
              você é cliente, os dados necessários à prestação dos serviços
              jurídicos (partes, números de processos, andamentos e documentos).
            </li>
            <li style={liStyle}>
              <strong>Dados de navegação:</strong> informações técnicas e cookies
              essenciais ao funcionamento do site e da área do cliente.
            </li>
          </ul>
        </Secao>

        <Secao titulo="4. Para que usamos os dados (finalidades)">
          <ul>
            <li style={liStyle}>Responder a contatos e solicitações.</li>
            <li style={liStyle}>
              Prestar os serviços jurídicos contratados e acompanhar processos.
            </li>
            <li style={liStyle}>
              Disponibilizar a área do cliente, com o andamento dos seus
              processos.
            </li>
            <li style={liStyle}>
              Cumprir obrigações legais, regulatórias e do dever profissional da
              advocacia.
            </li>
          </ul>
        </Secao>

        <Secao titulo="5. Bases legais">
          <p style={pStyle}>
            Tratamos seus dados com fundamento nas hipóteses da LGPD, conforme o
            caso: <strong>execução de contrato</strong> (prestação dos serviços
            jurídicos), <strong>cumprimento de obrigação legal ou regulatória</strong>,{" "}
            <strong>exercício regular de direitos</strong>,{" "}
            <strong>legítimo interesse</strong> e, quando aplicável,{" "}
            <strong>consentimento</strong> (por exemplo, ao enviar o formulário de
            contato).
          </p>
        </Secao>

        <Secao titulo="6. Compartilhamento">
          <p style={pStyle}>
            Não vendemos seus dados. Eles podem ser compartilhados apenas quando
            necessário: com o Poder Judiciário e órgãos públicos no curso dos
            processos; com prestadores que apoiam nossa operação (por exemplo,
            hospedagem e envio de e-mails), sob obrigação de confidencialidade; e
            quando exigido por lei ou ordem judicial.
          </p>
        </Secao>

        <Secao titulo="7. Por quanto tempo guardamos">
          <p style={pStyle}>
            Mantemos os dados pelo tempo necessário às finalidades acima e aos
            prazos legais aplicáveis (inclusive prazos prescricionais e o dever de
            guarda de documentos da advocacia). Depois disso, são eliminados ou
            anonimizados.
          </p>
        </Secao>

        <Secao titulo="8. Seus direitos como titular">
          <p style={pStyle}>
            A qualquer momento você pode solicitar, gratuitamente:
          </p>
          <ul>
            <li style={liStyle}>Confirmação de que tratamos seus dados e acesso a eles.</li>
            <li style={liStyle}>Correção de dados incompletos, inexatos ou desatualizados.</li>
            <li style={liStyle}>
              Anonimização, bloqueio ou eliminação de dados desnecessários ou
              tratados em desconformidade com a lei.
            </li>
            <li style={liStyle}>Portabilidade dos dados.</li>
            <li style={liStyle}>Informação sobre com quem compartilhamos seus dados.</li>
            <li style={liStyle}>
              Revogação do consentimento e oposição a tratamentos, quando
              cabível.
            </li>
          </ul>
          <p style={pStyle}>
            Para exercer qualquer direito, escreva ao nosso Encarregado:{" "}
            <a href={`mailto:${dpoEmail}`} style={{ color: COR.green }}>
              {dpoEmail}
            </a>
            . Responderemos no menor prazo possível.
          </p>
        </Secao>

        <Secao titulo="9. Cookies">
          <p style={pStyle}>
            Usamos <strong>cookies essenciais</strong>, necessários ao
            funcionamento do site e ao login seguro da área do cliente — esses não
            podem ser desativados. Caso venhamos a usar cookies de análise ou
            marketing, eles só serão ativados mediante o seu consentimento no aviso
            exibido ao acessar o site.
          </p>
        </Secao>

        <Secao titulo="10. Segurança">
          <p style={pStyle}>
            Adotamos medidas técnicas e organizacionais para proteger seus dados,
            como conexão criptografada (HTTPS), controle de acesso, senhas
            protegidas e registro de acessos. Na área do cliente, cada empresa vê
            exclusivamente os seus próprios processos.
          </p>
        </Secao>

        <Secao titulo="11. Alterações desta política">
          <p style={pStyle}>
            Podemos atualizar esta política a qualquer tempo. A data da última
            revisão fica sempre indicada no topo. Recomendamos revisá-la
            periodicamente.
          </p>
        </Secao>
      </div>

      <SiteFooter />
    </div>
  );
}

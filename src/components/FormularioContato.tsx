import { useEffect, useState, type FormEvent } from 'react';
import { Link } from '../lib/router';
import { linkWhatsApp } from '../site.config';
import { listar, mensagemDoLead, registrar } from '../lib/leads';
import { IconeWhatsApp } from './Icones';
import areas from '../content/areas.json';

const VAZIO = {
  nome: '',
  telefone: '',
  email: '',
  area: '',
  mensagem: '',
};

/**
 * Formulário sem servidor: valida, grava o contato como JSON no navegador e
 * abre o WhatsApp com tudo já escrito. O visitante só aperta "enviar" no
 * aplicativo — e o escritório recebe a mensagem no mesmo lugar em que já
 * atende, sem caixa de entrada nova para vigiar.
 */
export function FormularioContato({ origem = 'site' }: { origem?: string }) {
  const [dados, setDados] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [aceito, setAceito] = useState(false);
  const [jaContatou, setJaContatou] = useState(false);

  useEffect(() => {
    setJaContatou(listar().length > 0);
  }, []);

  function alterar(campo: keyof typeof VAZIO, valor: string) {
    setDados((anterior) => ({ ...anterior, [campo]: valor }));
    if (erro) setErro('');
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();

    if (dados.nome.trim().length < 2) return setErro('Informe seu nome.');
    if (dados.telefone.replace(/\D/g, '').length < 10)
      return setErro('Informe um telefone com DDD para retorno.');
    if (dados.mensagem.trim().length < 12)
      return setErro('Conte em poucas linhas o que precisa ser analisado.');
    if (!aceito) return setErro('É necessário aceitar a Política de Privacidade.');

    const lead = { ...dados, origem };
    registrar(lead);
    setEnviado(true);
    setJaContatou(true);

    // Abre o WhatsApp numa aba nova, já com o resumo preenchido.
    window.open(linkWhatsApp(mensagemDoLead(lead)), '_blank', 'noopener,noreferrer');
  }

  if (enviado) {
    return (
      <div className="aviso-form aviso-form--ok" role="status">
        <strong>Recebemos seus dados.</strong>
        <p style={{ margin: '0.5rem 0 0.9rem' }}>
          O WhatsApp foi aberto em outra aba com o resumo do seu contato. Se ele não abrir,
          use o botão abaixo — a mensagem continua pronta.
        </p>
        <a
          className="botao botao--zap"
          href={linkWhatsApp(mensagemDoLead({ ...dados, origem }))}
          target="_blank"
          rel="noopener noreferrer"
          data-cta="formulario-reabrir"
        >
          <IconeWhatsApp tamanho={17} />
          Abrir o WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <div className="campo--duplo">
        <div className="campo">
          <label htmlFor="nome">Nome</label>
          <input
            id="nome"
            name="nome"
            autoComplete="name"
            placeholder="Como devemos chamar você"
            value={dados.nome}
            onChange={(evento) => alterar('nome', evento.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="telefone">WhatsApp ou telefone</label>
          <input
            id="telefone"
            name="telefone"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(00) 00000-0000"
            value={dados.telefone}
            onChange={(evento) => alterar('telefone', evento.target.value)}
          />
        </div>
      </div>

      <div className="campo--duplo">
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={dados.email}
            onChange={(evento) => alterar('email', evento.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="area">Área relacionada</label>
          <select
            id="area"
            name="area"
            value={dados.area}
            onChange={(evento) => alterar('area', evento.target.value)}
          >
            <option value="">Selecione</option>
            {areas.map((area) => (
              <option key={area.slug} value={area.nome}>
                {area.nome}
              </option>
            ))}
            <option value="Outra questão">Outra questão</option>
          </select>
        </div>
      </div>

      <div className="campo">
        <label htmlFor="mensagem">Mensagem</label>
        <textarea
          id="mensagem"
          name="mensagem"
          placeholder="Conte brevemente o que precisa ser analisado. Não inclua senhas ou dados bancários."
          value={dados.mensagem}
          onChange={(evento) => alterar('mensagem', evento.target.value)}
        />
      </div>

      <label className="consentimento">
        <input
          type="checkbox"
          checked={aceito}
          onChange={(evento) => setAceito(evento.target.checked)}
        />
        <span>
          Li a <Link para="/politica-de-privacidade/">Política de Privacidade</Link> e autorizo o uso
          dos dados informados para retorno de contato e análise inicial da solicitação.
        </span>
      </label>

      {erro && (
        <div className="aviso-form aviso-form--erro" role="alert">
          {erro}
        </div>
      )}

      <button type="submit" className="botao botao--zap" data-cta="formulario">
        <IconeWhatsApp tamanho={18} />
        Enviar solicitação de contato
      </button>

      <p className="microtexto" style={{ marginTop: 0 }}>
        Ao enviar, o WhatsApp do escritório abre com o resumo já escrito.
        {jaContatou ? ' Você já enviou um contato por este site anteriormente.' : ''} Nenhum dado é
        gravado em servidor — as informações ficam no seu navegador até você enviar a mensagem.
      </p>
    </form>
  );
}

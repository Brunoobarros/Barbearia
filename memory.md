# Barbearia Premium - Memória do Projeto

Este documento serve como a base de conhecimento e registro histórico das decisões de arquitetura, funcionalidades e refinamentos aplicados ao sistema da **Barbearia Premium**.

---

## 📌 Visão Geral do Projeto
A **Barbearia Premium** é uma aplicação web moderna e responsiva voltada para o agendamento inteligente e gestão simplificada de serviços de barbearia. Com uma interface polida, responsiva e focada na melhor experiência de uso tanto para o cliente quanto para o administrador.

- **URL de Desenvolvimento**: [Acesse aqui](https://ais-dev-2di4wkzofcc6ss3ex432pe-749651059937.us-east1.run.app)
- **Tema Visual**: Escuro de Alta Performance (*Premium Dark/Slate*), utilizando acentos nas cores âmbar/laranja (`amber-500` e `orange-500`) com cantos arredondados, contrastes generosos e tipografia moderna.

---

## 🛠️ Stack Tecnológica
- **Componentes & Reatividade**: [React 18](https://react.dev/) com suporte nativo a hooks estruturados.
- **Transições e Animações**: [Framer Motion / Motion](https://motion.dev/) para proporcionar transições suaves e transições de tela fluidas.
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) para aplicação direta de classes utilitárias modernas e responsivas.
- **Ícones**: [Lucide React](https://lucide.dev/) para todos os elementos visuais.
- **Linguagem**: [TypeScript 5](https://www.typescriptlang.org/) exercendo forte tipagem para segurança do código.
- **Build System**: [Vite 6](https://vite.dev/) de carregamento rápido.

---

## 🗺️ Estrutura de Arquivos
- `/src/App.tsx` — Hub central do aplicativo com controle de abas de navegação principal ("Agendar", "Agendamento", "Admin") e gestão de estados comuns.
- `/src/types.ts` — Definições de contratos, enums de status e formatos de dados como `Appointment`, `Service`, `WorkingConfig`.
- `/src/utils.ts` — Funções utilitárias como cálculo de horários livres, verificação de datas da semana e formatadores locais em português.
- `/src/data.ts` — Banco de dados estático mockado para serviços (Corte, Barba, Combo) e configurações padrão para inicialização segura.
- `/src/components/`
  - `AppointmentForm.tsx` — Componente dinâmico de fluxo de agendamento do cliente em 3 etapas consecutivas.
  - `AdminPanel.tsx` — Central de ferramentas administrativa (configuração de funcionamento, faturamento estimado e controle de filas).
  - `AppointmentList.tsx` — Exibição das reservas do usuário com recurso de cancelamento e links rápidos para WhatsApp.
  - `NotificationCenter.tsx` — Painel de notificações em tempo real.
  - `InstallGuideModal.tsx` — Guia intuitivo de instalação como PWA ou atalho rápido.
  - `LucideIcon.tsx` — Helper inteligente para carregamento seguro de ícones dinâmicos.

---

## 💾 Armazenamento e Persistência de Dados
A aplicação funciona como uma **SPA Client-Side robusta e offline-first**. Para garantir a segurança dos agendamentos, configurações personalizadas e estados sem a necessidade imediata de infraestrutura complexa de backend, todas as informações são mantidas de forma resiliente no **`localStorage`** do navegador:

1. **Agendamentos (`barber_appointments`)**: Persiste a lista completa de reservas ativas, concluídas e canceladas de forma estruturada.
2. **Serviços Ativos (`barber_services`)**: Permite que o administrador altere preços, durações e disponibilidades de novos cortes, barbas ou combos, e essas mudanças permanecem ativas na máquina.
3. **Parâmetros de Funcionamento (`barber_config`)**: Guarda os dias de trabalho selecionados, limites de horário e dados do negócio configurados via Painel Admin.
4. **Alertas e Notificações (`barber_alerts`)**: Armazena os registros locais de novos agendamentos e transações efetuadas.
5. **Autenticação Administrativa (`barber_admin_auth`)**: Preserva temporariamente se a sessão do administrador está autorizada ou requer nova senha.
6. **Preferências Visuais (`barber_theme`)**: Guarda de forma fluida a escolha do usuário pelo Modo Claro ou pelo consagrado Modo Escuro Premium.

*Nota de segurança*: Os dados são sincronizados reativamente através de `useEffect` no arquivo central `App.tsx` sempre que os estados do React sofrem alteração, prevenindo qualquer perda de informação ao recarregar a aba ou fechar o navegador.

---

## 🎯 Regras de Negócio e Funcionalidades Críticas

### 1. Fluxo de Agendamento do Cliente (Formulário)
Dividido em três passos principais para evitar fadiga cognitiva:
*   **Passo 1: Seleção de Serviço** — Listagem interativa com preços, durações e botões de seleção destacados.
*   **Passo 2: Escolha de Data e Hora** — Seletor de calendário horizontal dos próximos 7 dias úteis de funcionamento, integrado à grade de horários disponíveis atualizada dinamicamente em formato grid.
*   **Passo 3: Dados de Contato e Confirmação** — Cadastro com validações avançadas de nome e telefone celular.

### 2. Validações Estritas de Telefone (WhatsApp)
- Implementadas tanto no momento do preenchimento da reserva quanto nas ferramentas de envio de mensagens do sistema.
- **Padrão de validação**: Rejeita números que não possuam ddd + 9 dígitos (11 dígitos no total) ou ddd + 8 dígitos (10 dígitos no total). Remove formatos residuais de strings não-numéricas e converte de forma transparente números com prefixo de país `55` garantindo compatibilidade estrita com a API oficial do WhatsApp Web.

### 3. Melhoria de Foco e Scroll no Passo 2 (Data & Hora)
Para otimizar o conforto visual do cliente ao navegar pelos horários livres da Barbearia:
- **Pré-Seleção Inteligente**: O sistema escolhe preventivamente o primeiro horário livre daquele dia para que o cliente já tenha uma opção pré-configurada ao avançar ou trocar de data.
- **Scroll Dinâmico Conforme o Horário**: 
  - Sempre que o horário selecionado ou pré-selecionado pelo sistema for igual ou posterior a **12:00 (Meio-Dia)**, o contêiner de horários faz um scroll suave vertical automático diretamente ao elemento usando o alinhamento central (`block: 'center'`).
  - Isso resolve o problema de o cliente não visualizar facilmente os horários do fim de tarde e noite (que ficavam escondidos abaixo do limite visível do painel com rolagem), sem a necessidade de quebrar os horários em turnos ou separadores visuais artificiais (o painel mantém todos os horários unidos, limpos e acessíveis, mas garantindo que o horário selecionado e as suas alternativas próximas mais tardias sempre saltem aos olhos imediatamente).

---

## ✍️ Histórico de Ajustes Recentes
1. **Validação de Inputs**: Incluída lógica de prevenção de números inválidos de WhatsApp no fechamento de agendamentos.
2. **Layout por Turnos (Rejeitado)**: Testada a separação dos horários em "Manhã", "Tarde" e "Noite". O formato foi removido a pedido por poluir visualmente e aumentar a jornada de cliques, retornando ao painel unificado e direto.
3. **Scroll Assistido**: Correção de bug de visibilidade de horários tardios usando efeitos colaterais estruturados que sincronizam o componente de exibição ao foco focal de seleção, garantindo visualização cristalina de qualquer período do dia.

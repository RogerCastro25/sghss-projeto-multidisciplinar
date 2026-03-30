const KEYS = {
  USERS: "sghss_users",
  CURRENT_USER: "sghss_current_user",
  CONSULTAS: "sghss_consultas",
  TELECONSULTA_ATUAL: "sghss_teleconsulta_atual"
};

const routes = {
  paciente: "./pages/paciente.html",
  medico: "./pages/medico.html",
  admin: "./pages/admin.html",
  teleconsulta: "./pages/teleconsulta.html"
};

function toast(message, type = "info") {
  let root = document.querySelector(".toast-root");
  if (!root) {
    root = document.createElement("div");
    root.className = "toast-root";
    document.body.appendChild(root);
  }

  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  root.appendChild(item);

  setTimeout(() => {
    item.remove();
  }, 2200);
}

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function nextId(items) {
  if (!Array.isArray(items) || !items.length) return Date.now();
  const maxId = items.reduce((acc, item) => Math.max(acc, Number(item.id) || 0), 0);
  return Math.max(Date.now(), maxId + 1);
}

function getUsersByType(type) {
  return read(KEYS.USERS, []).filter((user) => user.tipo === type);
}

function updateConsultaStatus(id, status) {
  const all = read(KEYS.CONSULTAS, []).map((item) => (item.id === id ? { ...item, status } : item));
  write(KEYS.CONSULTAS, all);
  return all.find((item) => item.id === id) || null;
}

function updateConsultaResumo(id, resumo) {
  const all = read(KEYS.CONSULTAS, []).map((item) => (item.id === id ? { ...item, resumoMedico: resumo } : item));
  write(KEYS.CONSULTAS, all);
  return all.find((item) => item.id === id) || null;
}

function canAccessTeleconsulta(consulta, current) {
  if (!consulta || !current) return false;
  if (![
    "aguardando",
    "em-andamento"
  ].includes(consulta.status)) return false;
  if (current.tipo === "paciente") return consulta.pacienteId === current.id;
  if (current.tipo === "medico") return consulta.medicoId === current.id;
  return false;
}

function ensureConfirmModal() {
  let modal = document.getElementById("appConfirmModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "appConfirmModal";
  modal.className = "modal hidden";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `
    <div class="modal-card">
      <h2 id="appConfirmTitle">Confirmar ação</h2>
      <p id="appConfirmMessage">Deseja continuar?</p>
      <div class="actions">
        <button id="appConfirmNo" class="btn" type="button">Cancelar</button>
        <button id="appConfirmYes" class="btn danger" type="button">Confirmar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function confirmAction({
  title = "Confirmar ação",
  message = "Deseja continuar?",
  confirmText = "Confirmar",
  confirmClass = "danger"
} = {}) {
  const modal = ensureConfirmModal();
  const titleEl = modal.querySelector("#appConfirmTitle");
  const messageEl = modal.querySelector("#appConfirmMessage");
  const yesBtn = modal.querySelector("#appConfirmYes");
  const noBtn = modal.querySelector("#appConfirmNo");

  titleEl.textContent = title;
  messageEl.textContent = message;
  yesBtn.textContent = confirmText;
  yesBtn.className = `btn ${confirmClass}`;

  return new Promise((resolve) => {
    const cleanup = () => {
      modal.classList.add("hidden");
      yesBtn.removeEventListener("click", onConfirm);
      noBtn.removeEventListener("click", onCancel);
      modal.removeEventListener("click", onOverlayClick);
    };

    const onConfirm = () => {
      cleanup();
      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    const onOverlayClick = (event) => {
      if (event.target === modal) {
        onCancel();
      }
    };

    yesBtn.addEventListener("click", onConfirm);
    noBtn.addEventListener("click", onCancel);
    modal.addEventListener("click", onOverlayClick);
    modal.classList.remove("hidden");
  });
}

function initializeData() {
  const users = read(KEYS.USERS, []);
  if (!users.length) {
    write(KEYS.USERS, [
      { id: 1, nome: "João Silva", email: "paciente@sghss.com", senha: "123456", tipo: "paciente" },
      { id: 2, nome: "Dra. Maria Santos", email: "medico@sghss.com", senha: "123456", tipo: "medico" },
      { id: 3, nome: "Administrador", email: "admin@sghss.com", senha: "123456", tipo: "admin" }
    ]);
  }

  const consultas = read(KEYS.CONSULTAS, []);
  if (!consultas.length) {
    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    write(KEYS.CONSULTAS, [
      { id: Date.now(), pacienteId: 1, medicoId: 2, data: amanha, motivo: "Retorno", status: "agendada" }
    ]);
  }
}

function getCurrentUser() {
  return read(KEYS.CURRENT_USER, null);
}

function setCurrentUser(user) {
  write(KEYS.CURRENT_USER, user);
}

function logout() {
  localStorage.removeItem(KEYS.CURRENT_USER);
  localStorage.removeItem(KEYS.TELECONSULTA_ATUAL);
  window.location.href = "../index.html";
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("pt-BR");
}

function statusBadge(status) {
  return `<span class="status ${status}">${status}</span>`;
}

function renderTable(containerId, headers, rowsHtml) {
  const root = document.getElementById(containerId);
  if (!root) return;
  if (!rowsHtml.length) {
    root.innerHTML = "<p>Nenhum registro encontrado.</p>";
    return;
  }

  root.innerHTML = `
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rowsHtml.join("")}</tbody>
    </table>
  `;
}

function handleLoginPage() {
  const form = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const alert = document.getElementById("alert");
  const current = getCurrentUser();

  if (current) {
    window.location.href = routes[current.tipo];
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const tipo = document.getElementById("tipo").value;

    if (!email || !senha || !tipo) {
      alert.className = "alert error";
      alert.textContent = "Preencha perfil, email e senha.";
      toast("Preencha todos os campos do login", "error");
      return;
    }

    const users = read(KEYS.USERS, []);
    const user = users.find(
      (u) => normalizeEmail(u.email) === normalizeEmail(email) && u.senha === senha && u.tipo === tipo
    );

    if (!user) {
      alert.className = "alert error";
      alert.textContent = "Credenciais inválidas.";
      toast("Login inválido", "error");
      return;
    }

    setCurrentUser({ id: user.id, nome: user.nome, tipo: user.tipo, email: user.email });
    alert.className = "alert success";
    alert.textContent = "Login realizado com sucesso.";
    toast("Login realizado", "success");
    setTimeout(() => {
      window.location.href = routes[user.tipo];
    }, 300);
  });

  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const nome = document.getElementById("regNome").value.trim();
      const email = normalizeEmail(document.getElementById("regEmail").value);
      const senha = document.getElementById("regSenha").value;

      if (!nome || !email || !senha) {
        toast("Preencha nome, email e senha para cadastro", "error");
        return;
      }

      if (senha.length < 6) {
        toast("A senha deve ter ao menos 6 caracteres", "error");
        return;
      }

      const users = read(KEYS.USERS, []);
      const emailExists = users.some((u) => normalizeEmail(u.email) === email);

      if (emailExists) {
        toast("Este email já está cadastrado", "error");
        return;
      }

      users.push({
        id: nextId(users),
        nome,
        email,
        senha,
        tipo: "paciente"
      });

      write(KEYS.USERS, users);
      registerForm.reset();
      document.getElementById("tipo").value = "paciente";
      document.getElementById("email").value = email;
      document.getElementById("senha").value = senha;
      toast("Paciente cadastrado com sucesso", "success");
    });
  }
}

function openTeleconsulta(id) {
  write(KEYS.TELECONSULTA_ATUAL, id);
  window.location.href = "./teleconsulta.html";
}

function protectPage(expectedType) {
  const current = getCurrentUser();
  if (!current || current.tipo !== expectedType) {
    window.location.href = "../index.html";
    return null;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  return current;
}

function handlePacientePage() {
  const current = protectPage("paciente");
  if (!current) return;

  document.getElementById("welcomePac").textContent = current.nome;
  const form = document.getElementById("agendarForm");
  const medicoSelect = document.getElementById("consultaMedico");
  const filterStatus = document.getElementById("pacFilterStatus");
  const filterDate = document.getElementById("pacFilterDate");
  const filterClear = document.getElementById("pacFilterClear");
  const quickTeleBtn = document.getElementById("pacTeleQuick");
  const teleStatus = document.getElementById("pacTeleStatus");
  const historyRootId = "pacienteHistoryTable";

  medicoSelect.innerHTML = [
    '<option value="">Selecione o médico</option>',
    ...getUsersByType("medico").map((medico) => `<option value="${medico.id}">${medico.nome}</option>`)
  ].join("");

  const refresh = () => {
    const medicos = read(KEYS.USERS, []);
    let consultas = read(KEYS.CONSULTAS, []).filter((c) => c.pacienteId === current.id);

    if (filterStatus.value) {
      consultas = consultas.filter((c) => c.status === filterStatus.value);
    }
    if (filterDate.value) {
      consultas = consultas.filter((c) => c.data.slice(0, 10) === filterDate.value);
    }

    document.getElementById("pacTotal").textContent = String(consultas.length);

    const prox = consultas
      .filter((c) => new Date(c.data) >= new Date() && c.status !== "cancelada")
      .sort((a, b) => new Date(a.data) - new Date(b.data))[0];
    document.getElementById("pacNext").textContent = prox ? formatDateTime(prox.data) : "-";

    const rows = consultas
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .map(
        (c) => {
          const medico = medicos.find((user) => user.id === c.medicoId);
          return `<tr>
          <td>${formatDateTime(c.data)}</td>
          <td>${medico ? medico.nome : "-"}</td>
          <td>${c.motivo}</td>
          <td>${statusBadge(c.status)}</td>
          <td class="actions">
            ${(c.status === "aguardando" || c.status === "em-andamento") ? `<button class="btn btn-small btn-primary" data-tele="${c.id}">Acessar</button>` : ""}
            ${c.status === "agendada" ? `<button class="btn btn-small danger" data-cancel="${c.id}">Cancelar</button>` : ""}
          </td>
        </tr>`;
        }
      );

    renderTable("pacienteTable", ["Data", "Médico", "Motivo", "Status", "Ações"], rows);

    const historicoRows = read(KEYS.CONSULTAS, [])
      .filter((c) => c.pacienteId === current.id && c.status === "encerrada")
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .map((c) => {
        const medico = medicos.find((user) => user.id === c.medicoId);
        return `<tr>
          <td>${formatDateTime(c.data)}</td>
          <td>${medico ? medico.nome : "-"}</td>
          <td>${c.motivo}</td>
          <td>${c.resumoMedico || "Sem evolução registrada"}</td>
          <td>${statusBadge(c.status)}</td>
        </tr>`;
      });
    renderTable(historyRootId, ["Data", "Médico", "Motivo", "Evolução", "Status"], historicoRows);

    const teleDisponiveis = read(KEYS.CONSULTAS, [])
      .filter((c) => c.pacienteId === current.id && ["aguardando", "em-andamento"].includes(c.status))
      .sort((a, b) => new Date(a.data) - new Date(b.data));

    if (teleDisponiveis.length) {
      quickTeleBtn.disabled = false;
      teleStatus.className = "tele-status on";
      teleStatus.textContent = "● Sala disponível";
    } else {
      quickTeleBtn.disabled = true;
      teleStatus.className = "tele-status off";
      teleStatus.textContent = "● Sala indisponível";
    }

    document.querySelectorAll("[data-tele]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-tele"));
        openTeleconsulta(id);
      });
    });

    document.querySelectorAll("[data-cancel]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-cancel"));
        const all = read(KEYS.CONSULTAS, []).map((item) => (item.id === id ? { ...item, status: "cancelada" } : item));
        write(KEYS.CONSULTAS, all);
        toast("Consulta cancelada", "info");
        refresh();
      });
    });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const medicoId = Number(document.getElementById("consultaMedico").value);
    const data = document.getElementById("consultaData").value;
    const motivo = document.getElementById("consultaMotivo").value.trim();
    const consultaDate = data ? new Date(data) : null;

    if (!medicoId || !data || !motivo) {
      toast("Selecione médico, data e motivo", "error");
      return;
    }

    if (!consultaDate || Number.isNaN(consultaDate.getTime()) || consultaDate <= new Date()) {
      toast("Informe uma data futura para a consulta", "error");
      return;
    }

    const all = read(KEYS.CONSULTAS, []);
    all.push({
      id: Date.now(),
      pacienteId: current.id,
      medicoId,
      data,
      motivo,
      status: "agendada"
    });
    write(KEYS.CONSULTAS, all);
    form.reset();
    medicoSelect.value = "";
    toast("Consulta agendada", "success");
    refresh();
  });

  filterStatus.addEventListener("change", refresh);
  filterDate.addEventListener("change", refresh);
  filterClear.addEventListener("click", () => {
    filterStatus.value = "";
    filterDate.value = "";
    refresh();
  });

  quickTeleBtn.addEventListener("click", () => {
    if (quickTeleBtn.disabled) return;

    const consultas = read(KEYS.CONSULTAS, [])
      .filter((c) => c.pacienteId === current.id && ["aguardando", "em-andamento"].includes(c.status))
      .sort((a, b) => new Date(a.data) - new Date(b.data));

    if (!consultas.length) {
      toast("Nenhum teleatendimento disponível no momento", "info");
      return;
    }

    openTeleconsulta(consultas[0].id);
  });

  refresh();
}

function handleMedicoPage() {
  const current = protectPage("medico");
  if (!current) return;

  document.getElementById("welcomeMed").textContent = current.nome;
  const filterStatus = document.getElementById("medFilterStatus");
  const filterDate = document.getElementById("medFilterDate");
  const filterSearch = document.getElementById("medFilterSearch");
  const filterClear = document.getElementById("medFilterClear");
  const quickTeleBtn = document.getElementById("medTeleQuick");
  const teleStatus = document.getElementById("medTeleStatus");

  const refresh = () => {
    const users = read(KEYS.USERS, []);
    let consultas = read(KEYS.CONSULTAS, []).filter((c) => c.medicoId === current.id);

    if (filterSearch.value.trim()) {
      const query = filterSearch.value.trim().toLowerCase();
      consultas = consultas.filter((c) => {
        const paciente = users.find((u) => u.id === c.pacienteId);
        return paciente && paciente.nome.toLowerCase().includes(query);
      });
    }

    if (filterStatus.value) {
      consultas = consultas.filter((c) => c.status === filterStatus.value);
    }
    if (filterDate.value) {
      consultas = consultas.filter((c) => c.data.slice(0, 10) === filterDate.value);
    }

    const hoje = new Date().toDateString();

    document.getElementById("medHoje").textContent = String(
      consultas.filter((c) => new Date(c.data).toDateString() === hoje).length
    );
    document.getElementById("medAndamento").textContent = String(
      consultas.filter((c) => c.status === "em-andamento").length
    );

    const rows = consultas
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .map((c) => {
        const paciente = users.find((u) => u.id === c.pacienteId);
        return `<tr>
          <td>${paciente ? paciente.nome : "-"}</td>
          <td>${formatDateTime(c.data)}</td>
          <td>${c.motivo}</td>
          <td>${statusBadge(c.status)}</td>
          <td class="actions">
            ${c.status === "agendada" ? `<button class="btn btn-small warning" data-update="${c.id}" data-status="aguardando">Confirmar</button>` : ""}
            ${c.status === "aguardando" ? `<button class="btn btn-small btn-primary" data-update="${c.id}" data-status="em-andamento">Iniciar</button>` : ""}
            ${c.status === "em-andamento" ? `<button class="btn btn-small" data-update="${c.id}" data-status="encerrada">Encerrar</button>` : ""}
            ${(c.status === "aguardando" || c.status === "em-andamento") ? `<button class="btn btn-small btn-primary" data-tele="${c.id}">Entrar</button>` : ""}
          </td>
        </tr>`;
      });

    renderTable("medicoTable", ["Paciente", "Data", "Motivo", "Status", "Ações"], rows);

    const historicoRows = read(KEYS.CONSULTAS, [])
      .filter((c) => c.medicoId === current.id && c.status === "encerrada")
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .map((c) => {
        const paciente = users.find((u) => u.id === c.pacienteId);
        return `<tr>
          <td>${paciente ? paciente.nome : "-"}</td>
          <td>${formatDateTime(c.data)}</td>
          <td>${c.motivo}</td>
          <td>${c.resumoMedico || "Sem evolução registrada"}</td>
          <td>${statusBadge(c.status)}</td>
        </tr>`;
      });
    renderTable("medicoHistoryTable", ["Paciente", "Data", "Motivo", "Evolução", "Status"], historicoRows);

    const teleDisponiveis = read(KEYS.CONSULTAS, [])
      .filter((c) => c.medicoId === current.id && ["aguardando", "em-andamento"].includes(c.status))
      .sort((a, b) => new Date(a.data) - new Date(b.data));

    if (teleDisponiveis.length) {
      quickTeleBtn.disabled = false;
      teleStatus.className = "tele-status on";
      teleStatus.textContent = "● Sala disponível";
    } else {
      quickTeleBtn.disabled = true;
      teleStatus.className = "tele-status off";
      teleStatus.textContent = "● Sala indisponível";
    }

    document.querySelectorAll("[data-tele]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-tele"));
        openTeleconsulta(id);
      });
    });

    document.querySelectorAll("[data-update]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.getAttribute("data-update"));
        const status = btn.getAttribute("data-status");

        if (status === "encerrada") {
          const confirmed = await confirmAction({
            title: "Confirmar encerramento",
            message: "Deseja realmente encerrar esta consulta?",
            confirmText: "Encerrar",
            confirmClass: "danger"
          });

          if (!confirmed) return;

          const resumo = window.prompt("Registre a evolução clínica desta consulta:", "Paciente orientado e sem sinais de gravidade.");
          if (resumo === null) return;
          if (!resumo.trim()) {
            toast("Informe uma evolução clínica antes de encerrar", "error");
            return;
          }

          updateConsultaResumo(id, resumo.trim());
        }

        updateConsultaStatus(id, status);
        toast(`Status atualizado para ${status}`, "success");
        refresh();
      });
    });
  };

  filterStatus.addEventListener("change", refresh);
  filterDate.addEventListener("change", refresh);
  filterSearch.addEventListener("input", refresh);
  filterClear.addEventListener("click", () => {
    filterStatus.value = "";
    filterDate.value = "";
    filterSearch.value = "";
    refresh();
  });

  quickTeleBtn.addEventListener("click", () => {
    if (quickTeleBtn.disabled) return;

    const consultas = read(KEYS.CONSULTAS, [])
      .filter((c) => c.medicoId === current.id && ["aguardando", "em-andamento"].includes(c.status))
      .sort((a, b) => new Date(a.data) - new Date(b.data));

    if (!consultas.length) {
      toast("Nenhum teleatendimento disponível no momento", "info");
      return;
    }

    openTeleconsulta(consultas[0].id);
  });

  refresh();
}

function handleAdminPage() {
  const current = protectPage("admin");
  if (!current) return;
  document.getElementById("welcomeAdm").textContent = current.nome;

  const createForm = document.getElementById("adminCreateUserForm");
  const filterTipo = document.getElementById("adminFilterTipo");
  const filterSearch = document.getElementById("adminFilterSearch");
  const filterClear = document.getElementById("adminFilterClear");

  const refresh = () => {
    const users = read(KEYS.USERS, []);
    const consultas = read(KEYS.CONSULTAS, []);
    let filteredUsers = [...users];

    if (filterTipo.value) {
      filteredUsers = filteredUsers.filter((user) => user.tipo === filterTipo.value);
    }

    if (filterSearch.value.trim()) {
      const query = filterSearch.value.trim().toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) => user.nome.toLowerCase().includes(query) || normalizeEmail(user.email).includes(query)
      );
    }

    document.getElementById("admUsers").textContent = String(users.length);
    document.getElementById("admConsultas").textContent = String(consultas.length);
    document.getElementById("admAbertas").textContent = String(
      consultas.filter((consulta) => ["agendada", "aguardando", "em-andamento"].includes(consulta.status)).length
    );

    const rows = filteredUsers.map(
      (user) => `<tr>
        <td>${user.nome}</td>
        <td>${user.email}</td>
        <td>${user.tipo}</td>
        <td class="actions">
          ${(user.tipo !== "admin") ? `<button class="btn btn-small danger" data-user-delete="${user.id}">Excluir</button>` : "-"}
        </td>
      </tr>`
    );
    renderTable("adminUsersTable", ["Nome", "Email", "Perfil", "Ações"], rows);

    const consultaRows = consultas
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .map((consulta) => {
        const paciente = users.find((user) => user.id === consulta.pacienteId);
        const medico = users.find((user) => user.id === consulta.medicoId);

        return `<tr>
          <td>${paciente ? paciente.nome : "-"}</td>
          <td>${medico ? medico.nome : "-"}</td>
          <td>${formatDateTime(consulta.data)}</td>
          <td>${consulta.motivo}</td>
          <td>${consulta.resumoMedico || "-"}</td>
          <td>${statusBadge(consulta.status)}</td>
        </tr>`;
      });

    renderTable("adminConsultasTable", ["Paciente", "Médico", "Data", "Motivo", "Evolução", "Status"], consultaRows);

    document.querySelectorAll("[data-user-delete]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = Number(button.getAttribute("data-user-delete"));
        const usersAtual = read(KEYS.USERS, []);
        const user = usersAtual.find((item) => item.id === id);
        if (!user) return;

        const possuiConsulta = read(KEYS.CONSULTAS, []).some(
          (consulta) => consulta.pacienteId === id || consulta.medicoId === id
        );

        const confirmed = await confirmAction({
          title: "Excluir usuário",
          message: possuiConsulta
            ? "Este usuário possui consultas vinculadas. Excluir remove também essas consultas. Deseja continuar?"
            : "Deseja realmente excluir este usuário?",
          confirmText: "Excluir",
          confirmClass: "danger"
        });

        if (!confirmed) return;

        const usersAfterDelete = usersAtual.filter((item) => item.id !== id);
        write(KEYS.USERS, usersAfterDelete);

        if (possuiConsulta) {
          const consultasAfterDelete = read(KEYS.CONSULTAS, []).filter(
            (consulta) => consulta.pacienteId !== id && consulta.medicoId !== id
          );
          write(KEYS.CONSULTAS, consultasAfterDelete);
        }

        toast(`Usuário ${user.nome} excluído`, "info");
        refresh();
      });
    });
  };

  createForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const nome = document.getElementById("adminUserNome").value.trim();
    const email = normalizeEmail(document.getElementById("adminUserEmail").value);
    const senha = document.getElementById("adminUserSenha").value;
    const tipo = document.getElementById("adminUserTipo").value;

    if (!nome || !email || !senha || !tipo) {
      toast("Preencha todos os campos para cadastrar", "error");
      return;
    }

    const users = read(KEYS.USERS, []);
    const emailExists = users.some((user) => normalizeEmail(user.email) === email);
    if (emailExists) {
      toast("Este email já existe no sistema", "error");
      return;
    }

    users.push({
      id: nextId(users),
      nome,
      email,
      senha,
      tipo
    });

    write(KEYS.USERS, users);
    createForm.reset();
    toast(`${tipo} cadastrado com sucesso`, "success");
    refresh();
  });

  filterTipo.addEventListener("change", refresh);
  filterSearch.addEventListener("input", refresh);
  filterClear.addEventListener("click", () => {
    filterTipo.value = "";
    filterSearch.value = "";
    refresh();
  });

  refresh();
}

function handleTeleconsultaPage() {
  const current = getCurrentUser();
  if (!current || (current.tipo !== "paciente" && current.tipo !== "medico")) {
    window.location.href = "../index.html";
    return;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const consultaId = Number(read(KEYS.TELECONSULTA_ATUAL, 0));
  const consultas = read(KEYS.CONSULTAS, []);
  const users = read(KEYS.USERS, []);
  let consulta = consultas.find((c) => c.id === consultaId);

  if (!consulta) {
    toast("Consulta não encontrada", "error");
    window.location.href = current.tipo === "medico" ? "./medico.html" : "./paciente.html";
    return;
  }

  if (!canAccessTeleconsulta(consulta, current)) {
    localStorage.removeItem(KEYS.TELECONSULTA_ATUAL);
    toast("Acesso não permitido para esta consulta", "error");
    setTimeout(() => {
      window.location.href = current.tipo === "medico" ? "./medico.html" : "./paciente.html";
    }, 350);
    return;
  }

  const paciente = users.find((u) => u.id === consulta.pacienteId);
  const medico = users.find((u) => u.id === consulta.medicoId);
  const btnIniciarTele = document.getElementById("btnIniciarTele");
  const btnEncerrarTele = document.getElementById("btnEncerrarTele");

  function renderTeleStatus() {
    document.getElementById("teleStatus").innerHTML = statusBadge(consulta.status);
    const isDoctor = current.tipo === "medico";

    btnIniciarTele.hidden = !isDoctor;
    btnEncerrarTele.hidden = !isDoctor;
    btnIniciarTele.disabled = consulta.status !== "aguardando";
    btnEncerrarTele.disabled = consulta.status !== "em-andamento";
  }

  document.getElementById("teleWelcome").textContent = current.nome;
  document.getElementById("telePaciente").textContent = paciente ? paciente.nome : "-";
  document.getElementById("teleMedico").textContent = medico ? medico.nome : "-";
  document.getElementById("teleData").textContent = formatDateTime(consulta.data);
  document.getElementById("teleMotivo").textContent = consulta.motivo;
  renderTeleStatus();

  document.getElementById("btnVoltarTele").addEventListener("click", () => {
    localStorage.removeItem(KEYS.TELECONSULTA_ATUAL);
    window.location.href = current.tipo === "medico" ? "./medico.html" : "./paciente.html";
  });

  document.getElementById("btnIniciarTele").addEventListener("click", () => {
    if (current.tipo !== "medico" || consulta.status !== "aguardando") return;

    consulta = updateConsultaStatus(consulta.id, "em-andamento") || consulta;
    renderTeleStatus();
    toast("Atendimento iniciado", "success");
  });

  document.getElementById("btnEncerrarTele").addEventListener("click", async () => {
    const confirmed = await confirmAction({
      title: "Confirmar encerramento",
      message: "Deseja realmente encerrar esta consulta?",
      confirmText: "Encerrar",
      confirmClass: "danger"
    });

    if (!confirmed) return;

    if (current.tipo !== "medico" || consulta.status !== "em-andamento") {
      return;
    }

    consulta = updateConsultaStatus(consulta.id, "encerrada") || consulta;
    renderTeleStatus();
    toast("Consulta encerrada", "info");
    localStorage.removeItem(KEYS.TELECONSULTA_ATUAL);
    setTimeout(() => {
      window.location.href = "./medico.html";
    }, 600);
  });
}

function init() {
  initializeData();
  const page = document.body.dataset.page;
  if (page === "login") handleLoginPage();
  if (page === "paciente") handlePacientePage();
  if (page === "medico") handleMedicoPage();
  if (page === "admin") handleAdminPage();
  if (page === "teleconsulta") handleTeleconsultaPage();
}

init();

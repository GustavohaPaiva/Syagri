import { useState } from "react";
import { AlertMessage } from "../ui/AlertMessage";
import { FormSection } from "../ui/FormSection";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { ModalFormFooter } from "../ui/ModalFormFooter";
import { useAbortableAsync } from "../../hooks/useAbortableAsync";
import { supabase } from "../../services/supabase";
import { buildSyagriEmail } from "../../utils/syagriEmail";

const FORM_ID = "form-novo-consultor";

export function ModalNovoConsultor({ open, onClose, onCreated }) {
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useAbortableAsync(
    async (_signal, isActive) => {
      if (!isActive()) return;
      setNome("");
      setUsuario("");
      setSenha("");
      setFormError(null);
      setSaving(false);
    },
    [open],
    open,
  );

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    const p_nome = nome.trim();
    const p_email = buildSyagriEmail(usuario);

    if (!p_nome) {
      setFormError("Informe o nome do consultor.");
      return;
    }
    if (!p_email) {
      setFormError("Informe um usuário válido.");
      return;
    }
    if (!senha || senha.length < 8) {
      setFormError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.rpc("create_consultant", {
      p_email,
      p_password: senha,
      p_nome,
    });
    setSaving(false);

    if (error) {
      setFormError(error.message || "Não foi possível criar o consultor.");
      return;
    }

    if (!data) {
      setFormError("Resposta inesperada do servidor.");
      return;
    }

    onCreated?.();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo consultor"
      footer={
        <ModalFormFooter
          formId={FORM_ID}
          submitLabel="Cadastrar consultor"
          loading={saving}
          onCancel={handleClose}
        />
      }
    >
      <form
        id={FORM_ID}
        className="flex flex-col gap-6"
        onSubmit={handleSubmit}
        noValidate
      >
        <FormSection>
          <Input
            label="Nome completo"
            name="nome"
            autoComplete="name"
            placeholder="Ex.: João Silva"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={saving}
          />
        </FormSection>

        <FormSection>
          <div className="flex flex-col gap-4">
            <Input
              label="Usuário"
              name="usuario"
              autoComplete="off"
              placeholder="ex.: joao"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={saving}
            />
            <Input
              label="Senha"
              name="senha"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={saving}
            />
          </div>
        </FormSection>

        {formError ? <AlertMessage>{formError}</AlertMessage> : null}
      </form>
    </Modal>
  );
}

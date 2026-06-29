/* ============================================================
   CREDITXA — Loan Application Modal Controller
   Handles step navigation, validation, pill selection,
   and final submission to Supabase (clients + loan_applications)
   ============================================================ */
(function () {
  let currentStep = 1;
  const TOTAL_STEPS = 4;
  let prefillAmount = null;
  let prefillTerm = null;
  let prefillType = 'personal';

  const overlay   = document.getElementById('appModalOverlay');
  const form      = document.getElementById('appForm');
  const btnNext   = document.getElementById('appBtnNext');
  const btnBack   = document.getElementById('appBtnBack');
  const btnClose  = document.getElementById('appModalClose');
  const title     = document.getElementById('appModalTitle');
  const summaryEl = document.getElementById('appSummary');

  if (!overlay) return; // modal not present on this page

  /* ── Pill group selection (residence_status / employment_status) ── */
  document.querySelectorAll('.app-pill-group').forEach(group => {
    const inputName = group.dataset.pillName;
    const hiddenInput = group.parentElement.querySelector(`input[type="hidden"][name="${inputName}"]`);
    group.querySelectorAll('.app-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        group.querySelectorAll('.app-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        hiddenInput.value = pill.dataset.value;
        clearFieldError(hiddenInput.closest('.app-field'));
      });
    });
  });

  /* ── Open modal (called from apply buttons across the site) ── */
  window.openApplicationModal = function (opts) {
    opts = opts || {};
    prefillAmount = opts.amount || null;
    prefillTerm   = opts.term || null;
    prefillType   = opts.loanType || 'personal';

    const typeLabels = { personal: 'Crédito Pessoal', mortgage: 'Crédito Habitação', car: 'Crédito Automóvel', consolidation: 'Consolidação de Créditos' };
    title.textContent = 'Pedido de ' + (typeLabels[prefillType] || 'Crédito');

    goToStep(1);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  btnClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  /* ── Step navigation ── */
  function goToStep(step) {
    currentStep = step;
    document.querySelectorAll('.app-form-step').forEach(s => s.classList.remove('active'));
    const target = document.querySelector(`.app-form-step[data-step="${step}"]`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.app-modal__step-bar').forEach(bar => {
      const n = parseInt(bar.dataset.stepBar);
      bar.classList.remove('active', 'done');
      if (n < step) bar.classList.add('done');
      else if (n === step) bar.classList.add('active');
    });

    btnBack.style.display = step > 1 ? 'inline-flex' : 'none';
    btnNext.textContent = step === TOTAL_STEPS ? 'Enviar Pedido →' : 'Continuar →';

    if (step === TOTAL_STEPS) renderSummary();
  }

  function renderSummary() {
    const data = collectFormData();
    const typeLabels = { personal: 'Crédito Pessoal', mortgage: 'Crédito Habitação', car: 'Crédito Automóvel', consolidation: 'Consolidação' };
    const rows = [
      ['Nome', data.full_name],
      ['NIF', data.nif],
      ['Telefone', data.phone],
      ['Email', data.email],
      ['Rendimento Mensal', data.monthly_income ? '€' + Number(data.monthly_income).toLocaleString('pt-PT') : '—'],
    ];
    if (prefillAmount) rows.push(['Montante Pretendido', '€' + Number(prefillAmount).toLocaleString('pt-PT')]);
    if (prefillTerm) rows.push(['Prazo', prefillTerm + ' meses']);
    rows.push(['Tipo de Crédito', typeLabels[prefillType] || prefillType]);

    summaryEl.innerHTML = rows.map(([label, value]) => `
      <div class="app-summary__row">
        <span class="app-summary__label">${label}</span>
        <span class="app-summary__value">${value || '—'}</span>
      </div>
    `).join('');
  }

  /* ── Validation per step ── */
  function validateStep(step) {
    const stepEl = document.querySelector(`.app-form-step[data-step="${step}"]`);
    let valid = true;

    stepEl.querySelectorAll('input[required], select[required]').forEach(input => {
      const field = input.closest('.app-field');
      let fieldValid = true;

      if (input.type === 'checkbox') {
        fieldValid = input.checked;
      } else if (input.type === 'hidden') {
        fieldValid = !!input.value;
      } else {
        fieldValid = input.value.trim().length > 0;
      }

      // Extra validation rules
      if (fieldValid && input.name === 'nif') {
        fieldValid = /^\d{9}$/.test(input.value.trim());
      }
      if (fieldValid && input.name === 'date_of_birth') {
        const dob = new Date(input.value);
        const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        fieldValid = age >= 18 && age < 100;
      }
      if (fieldValid && input.name === 'email') {
        fieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      }
      if (fieldValid && input.name === 'phone') {
        fieldValid = input.value.replace(/\D/g, '').length >= 9;
      }
      if (fieldValid && input.name === 'iban') {
        fieldValid = input.value.replace(/\s/g, '').length >= 15;
      }

      if (field) {
        if (fieldValid) {
          clearFieldError(field);
        } else {
          field.classList.add('has-error');
          valid = false;
        }
      } else if (!fieldValid) {
        valid = false;
      }
    });

    return valid;
  }

  function clearFieldError(field) {
    if (field) field.classList.remove('has-error');
  }

  function collectFormData() {
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => { data[key] = value; });
    return data;
  }

  /* ── Next / Submit button ── */
  btnNext.addEventListener('click', async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1);
    } else {
      await submitApplication();
    }
  });

  btnBack.addEventListener('click', () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  /* ── Submit to Supabase ── */
  async function submitApplication() {
    btnNext.disabled = true;
    btnBack.disabled = true;
    btnNext.innerHTML = '<span class="app-spinner"></span> A enviar...';

    const data = collectFormData();
    const loanTypeMap = { personal: 'personal', mortgage: 'mortgage', car: 'car', consolidation: 'consolidation' };
    const rateMap = { personal: 0.0799, mortgage: 0.0309, car: 0.0599, consolidation: 0.0649 };

    try {
      const sb = window._supabase || window.supabase_client;
      if (!sb) throw new Error('Supabase client not initialized');

      // 1. Check if client already exists by NIF or email
      const { data: existing } = await sb
        .from('clients')
        .select('id')
        .or(`nif.eq.${data.nif},email.eq.${data.email}`)
        .limit(1);

      let clientId;

      if (existing && existing.length > 0) {
        clientId = existing[0].id;
        // Update existing client with latest info
        await sb.from('clients').update({
          full_name: data.full_name,
          phone: data.phone,
          address: data.address,
          date_of_birth: data.date_of_birth,
          monthly_income: parseFloat(data.monthly_income) || null,
          nationality: data.nationality,
          residence_status: data.residence_status,
          id_document_type: data.id_document_type,
          id_document_number: data.id_document_number,
          iban: data.iban.replace(/\s/g, ''),
          employment_status: data.employment_status,
        }).eq('id', clientId);
      } else {
        // Generate client code
        const clientCode = 'C-' + Date.now().toString().slice(-6);
        const { data: newClient, error: clientErr } = await sb.from('clients').insert({
          client_code: clientCode,
          full_name: data.full_name,
          email: data.email,
          nif: data.nif,
          phone: data.phone,
          address: data.address,
          date_of_birth: data.date_of_birth,
          monthly_income: parseFloat(data.monthly_income) || null,
          nationality: data.nationality,
          residence_status: data.residence_status,
          id_document_type: data.id_document_type,
          id_document_number: data.id_document_number,
          iban: data.iban.replace(/\s/g, ''),
          employment_status: data.employment_status,
          status: 'active',
        }).select('id').single();

        if (clientErr) throw clientErr;
        clientId = newClient.id;
      }

      // 2. Create the loan application
      const applicationNo = 'CR-' + new Date().getFullYear() + '-' + Date.now().toString().slice(-5);
      const loanType = loanTypeMap[prefillType] || 'personal';
      const amount = prefillAmount || 10000;
      const term = prefillTerm || 36;

      const { error: appErr } = await sb.from('loan_applications').insert({
        application_no: applicationNo,
        client_id: clientId,
        loan_type: loanType,
        amount: amount,
        term_months: term,
        annual_rate: rateMap[loanType] || 0.0799,
        status: 'pending',
        loan_purpose: data.loan_purpose,
        existing_debts: parseFloat(data.existing_debts) || 0,
        source: 'website',
      });

      if (appErr) throw appErr;

      // 3. Show success
      document.querySelectorAll('.app-form-step').forEach(s => s.style.display = 'none');
      document.querySelector('.app-form-step[data-step="success"]').style.display = 'block';
      document.getElementById('appRefCode').textContent = '#' + applicationNo;
      document.getElementById('appModalFooter').style.display = 'none';
      document.querySelectorAll('.app-modal__step-bar').forEach(b => b.classList.add('done'));

      window.showToast && window.showToast('🎉 Pedido recebido! Entraremos em contacto em breve.');

    } catch (err) {
      console.error('Application submission error:', err);
      alert('Ocorreu um erro ao enviar o seu pedido. Por favor tente novamente ou contacte-nos diretamente.\n\n' + (err.message || ''));
      btnNext.disabled = false;
      btnBack.disabled = false;
      btnNext.textContent = 'Enviar Pedido →';
    }
  }

  /* ── Reset modal when closed (for reuse) ── */
  overlay.addEventListener('transitionend', () => {
    if (!overlay.classList.contains('open')) resetModal();
  });

  function resetModal() {
    setTimeout(() => {
      if (overlay.classList.contains('open')) return;
      form.reset();
      document.querySelectorAll('.app-pill').forEach(p => p.classList.remove('selected'));
      document.querySelectorAll('.app-field').forEach(f => f.classList.remove('has-error'));
      document.querySelectorAll('.app-form-step').forEach(s => s.style.display = '');
      document.querySelector('.app-form-step[data-step="success"]').style.display = 'none';
      document.getElementById('appModalFooter').style.display = 'flex';
      btnNext.disabled = false;
      btnBack.disabled = false;
      goToStep(1);
    }, 300);
  }
})();

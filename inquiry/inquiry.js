(() => {
  // Submissions go to the existing Google Form, so replies keep landing in the same sheet.
  const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfDmgC_73fXfLzhhiYqToSkh7HOVvWowS1XimrFYWz7TIZYlA/formResponse';
  const E = {
    name: 954467807, phone: 1270686030, email: 1763030459, need: 1000057, eventType: 1272741673,
    editType: 1102726637, date1: 344054257, time1: 1427535183, date2: 747308903, time2: 1616027121,
    location: 157043843, hours: 1803110537, guests: 967112212, addons: 439037357, details: 1000023,
  };
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('#inqForm'), err = $('#inqErr'), btn = $('#inqBtn');

  // "Other" event type reveals a text box
  const other = $('#evOther'), otherText = $('#evOtherText');
  other.addEventListener('change', () => { otherText.hidden = !other.checked; if (other.checked) otherText.focus(); });

  const fail = (msg, el) => { err.textContent = msg; err.hidden = false; (el || err).scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  const payload = () => {
    const f = new FormData(form), p = new URLSearchParams();
    const put = (k, v) => { if (v !== null && v !== '') p.append('entry.' + E[k], v); };
    ['name', 'phone', 'email', 'need', 'location', 'hours', 'guests', 'details', 'time1'].forEach((k) => put(k, (f.get(k) || '').toString().trim()));
    ['eventType', 'editType', 'addons'].forEach((k) => f.getAll(k).forEach((v) => put(k, v)));
    if (f.getAll('eventType').includes('__other_option__')) p.append('entry.' + E.eventType + '.other_option_response', (f.get('eventTypeOther') || '').toString().trim());
    [['date1'], ['date2']].forEach(([k]) => {
      const v = (f.get(k) || '').toString();                       // yyyy-mm-dd
      if (v) { const [y, m, d] = v.split('-'); p.append(`entry.${E[k]}_year`, y); p.append(`entry.${E[k]}_month`, String(+m)); p.append(`entry.${E[k]}_day`, String(+d)); }
    });
    const t2 = (f.get('time2') || '').toString();                  // hh:mm (24h)
    if (t2) { const [h, m] = t2.split(':'); p.append(`entry.${E.time2}_hour`, String(+h)); p.append(`entry.${E.time2}_minute`, String(+m)); }
    p.append('fvv', '1'); p.append('pageHistory', '0');
    return p;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    if ($('.hp').value) return;                                    // bots fill the hidden field

    for (const el of form.querySelectorAll('input[required], select[required]')) {
      if (!el.value.trim()) { el.focus(); return fail('Please fill in the required fields (marked *).', el); }
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.value.trim())) return fail('Please enter a valid email address.', form.email);
    for (const g of form.querySelectorAll('.grp[data-required]')) {
      if (!g.querySelector('input:checked')) return fail('Please choose an option for: ' + g.querySelector('.q').textContent.replace(/\*|Select multiple if applicable/g, '').trim(), g);
    }
    if (other.checked && !otherText.value.trim()) { otherText.focus(); return fail('Please tell us what the "Other" event is.', otherText); }

    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      await fetch(FORM_URL, { method: 'POST', mode: 'no-cors', body: payload() });
      form.hidden = true; $('#inqThanks').hidden = false; $('#inqThanks').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (x) {
      btn.disabled = false; btn.textContent = 'Send inquiry →';
      fail("Couldn't send that — please check your connection, or contact us at froznmediainc@gmail.com / 416-475-4545.");
    }
  });
})();

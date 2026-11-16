function installGoogleFormSubmitTrigger() {
  const properties = PropertiesService.getScriptProperties();
  const formId = properties.getProperty('GOOGLE_FORM_ID');
  if (!formId) throw new Error('Isi Script Property GOOGLE_FORM_ID terlebih dahulu.');

  const form = FormApp.openById(formId);
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'onSimpFormSubmit')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('onSimpFormSubmit')
    .forForm(form)
    .onFormSubmit()
    .create();

  Logger.log('Trigger hasil Google Form berhasil dipasang untuk: ' + form.getTitle());
}

function generateSimpNisnPrefillUrl() {
  const formId = PropertiesService.getScriptProperties().getProperty('GOOGLE_FORM_ID');
  if (!formId) throw new Error('Isi Script Property GOOGLE_FORM_ID terlebih dahulu.');

  const form = FormApp.openById(formId);
  const questions = [
    { title: 'NAMA', marker: 'SIMPATIK_NAME_PREFILL' },
    { title: 'NISN', marker: 'SIMPATIK_NISN_PREFILL' },
    { title: 'KODE PESERTA', marker: 'SIMPATIK_CODE_PREFILL' },
    { title: 'KELAS', marker: 'SIMPATIK_CLASS_PREFILL' }
  ];
  const response = form.createResponse();

  questions.forEach(question => {
    const item = form.getItems().find(entry =>
      String(entry.getTitle() || '').trim() === question.title
    );
    if (!item) throw new Error('Tambahkan pertanyaan Jawaban singkat dengan judul persis ' + question.title + '.');

    if (item.getType() === FormApp.ItemType.TEXT) {
      response.withItemResponse(item.asTextItem().createResponse(question.marker));
    } else {
      throw new Error('Pertanyaan ' + question.title + ' harus menggunakan jenis Jawaban singkat.');
    }
  });

  const prefilledUrl = response.toPrefilledUrl();
  Logger.log('Salin tautan praisi ini ke kolom Link Google Form di SIMPATIK:');
  Logger.log(prefilledUrl);
  return prefilledUrl;
}

function onSimpFormSubmit(event) {
  if (!event || !event.response) throw new Error('Event respons Google Form tidak ditemukan.');

  const properties = PropertiesService.getScriptProperties();
  const webhookUrl = properties.getProperty('SIMPATIK_WEBHOOK_URL');
  const secret = properties.getProperty('SIMPATIK_WEBHOOK_SECRET');
  const formId = properties.getProperty('GOOGLE_FORM_ID');
  if (!webhookUrl || !secret || !formId) {
    throw new Error('Lengkapi SIMPATIK_WEBHOOK_URL, SIMPATIK_WEBHOOK_SECRET, dan GOOGLE_FORM_ID.');
  }

  const response = event.response;
  const answers = {};
  response.getItemResponses().forEach(itemResponse => {
    const title = String(itemResponse.getItem().getTitle() || '').trim();
    if (title) answers[title] = itemResponse.getResponse();
  });

  const nisn = String(answers.NISN || answers.nisn || '').trim();
  const participantCode = String(answers['KODE PESERTA'] || answers['Kode Peserta'] || '').trim();
  const studentName = String(answers.NAMA || answers.Nama || '').trim();
  const className = String(answers.KELAS || answers.Kelas || '').trim();
  if (!studentName) throw new Error('Form harus memiliki pertanyaan wajib dengan judul persis: NAMA.');
  if (!className) throw new Error('Form harus memiliki pertanyaan wajib dengan judul persis: KELAS.');
  if (!nisn) throw new Error('Form harus memiliki pertanyaan wajib dengan judul persis: NISN.');
  if (!participantCode) throw new Error('Form harus memiliki pertanyaan wajib dengan judul persis: KODE PESERTA.');

  const gradable = response.getGradableItemResponses();
  const score = gradable.reduce((sum, itemResponse) => sum + Number(itemResponse.getScore() || 0), 0);
  const total = gradable.reduce((sum, itemResponse) => {
    const item = itemResponse.getItem();
    const points = typeof item.getPoints === 'function' ? item.getPoints() : 0;
    return sum + Number(points || 0);
  }, 0);

  if (total <= 0) {
    throw new Error('Total poin kuis tidak ditemukan. Aktifkan mode Kuis dan atur poin untuk soal yang dinilai otomatis.');
  }

  const payload = {
    formId: formId,
    responseId: response.getId(),
    nisn: nisn,
    participantCode: participantCode,
    studentName: studentName,
    className: className,
    score: score,
    total: total,
    submittedAt: response.getTimestamp().toISOString()
  };

  let lastError = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = UrlFetchApp.fetch(webhookUrl, {
        method: 'post',
        contentType: 'application/json',
        headers: { 'x-google-form-secret': secret },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      const status = result.getResponseCode();
      const body = result.getContentText();
      if (status >= 200 && status < 300) {
        Logger.log('Nilai terkirim ke SIMPATIK: ' + body);
        return;
      }
      lastError = 'HTTP ' + status + ': ' + body;
    } catch (error) {
      lastError = String(error);
    }
    Utilities.sleep(attempt * 1500);
  }

  throw new Error('Gagal mengirim hasil setelah 3 percobaan. ' + lastError);
}

function testSimpFormConfiguration() {
  const properties = PropertiesService.getScriptProperties();
  const formId = properties.getProperty('GOOGLE_FORM_ID');
  const webhookUrl = properties.getProperty('SIMPATIK_WEBHOOK_URL');
  const secret = properties.getProperty('SIMPATIK_WEBHOOK_SECRET');
  if (!formId || !webhookUrl || !secret) {
    throw new Error('Script Properties belum lengkap.');
  }
  const form = FormApp.openById(formId);
  Logger.log('Form terhubung: ' + form.getTitle());
  Logger.log('Webhook: ' + webhookUrl);
  Logger.log('Konfigurasi siap. Jalankan installGoogleFormSubmitTrigger untuk memasang trigger.');
}

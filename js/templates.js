const Templates = {
  socialIcons: {
    linkedin: 'https://cdn-icons-png.flaticon.com/16/174/174857.png',
    facebook: 'https://cdn-icons-png.flaticon.com/16/733/733547.png',
    twitter: 'https://cdn-icons-png.flaticon.com/16/733/733579.png',
    instagram: 'https://cdn-icons-png.flaticon.com/16/2111/2111463.png',
  },

  getSocialHtml(links) {
    return Object.entries(links)
      .filter(([, url]) => url)
      .map(([platform, url]) =>
        `<a href="${url}" target="_blank" style="text-decoration:none;margin-right:5px">
          <img src="${this.socialIcons[platform] || ''}" alt="${platform}" style="width:16px;height:16px;border:none">
        </a>`
      )
      .join('');
  },

  getVCard(data) {
    return [
      'BEGIN:VCARD', 'VERSION:3.0',
      `FN:${data.firstName} ${data.lastName}`,
      `N:${data.lastName};${data.firstName};;;`,
      `ORG:${data.company || ''}`,
      `TITLE:${data.title || ''}`,
      data.email ? `EMAIL:${data.email}` : '',
      data.phone ? `TEL;TYPE=WORK,VOICE:${data.phone}` : '',
      data.mobile ? `TEL;TYPE=CELL:${data.mobile}` : '',
      data.address ? `ADR;TYPE=WORK:;;${data.address};;;;` : '',
      'END:VCARD'
    ].filter(Boolean).join('\n');
  },

  getQRCodeUrl(data) {
    const vcard = this.getVCard(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(vcard)}`;
  },

  getDynamicStatus() {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    if (day === 0 || day === 6) return '👤 En ligne cette semaine';
    if (hours < 9 || hours >= 18) return '👤 Hors horaires de travail';
    return '';
  },

  getFontFamily(font) {
    return font || 'Arial,Helvetica,sans-serif';
  },

  classic(data, color, font) {
    const tel = [data.phone, data.phone2].filter(Boolean).join(' / ');
    const ff = this.getFontFamily(font);
    const status = data.dynamicStatus ? this.getDynamicStatus() : '';
    return `
      <table cellpadding="0" cellspacing="0" border="0" style="font-family:${ff};font-size:13px;color:#333;line-height:1.5;max-width:560px">
        ${data.logoUrl ? `<tr><td colspan="2" style="padding-bottom:8px"><img src="${data.logoUrl}" alt="Logo" style="max-height:55px;max-width:180px;"></td></tr>` : ''}
        <tr>
          ${data.photoUrl ? `<td valign="middle" style="padding-right:15px"><img src="${data.photoUrl}" alt="" style="width:70px;height:70px;border-radius:50%;object-fit:cover"></td>` : ''}
          <td valign="middle">
            <div style="font-size:16px;font-weight:bold;color:#222">${data.firstName} ${data.lastName}</div>
            ${data.title ? `<div style="color:${color};font-weight:600;margin:2px 0">${data.title}</div>` : ''}
            ${data.company ? `<div style="color:#666;font-size:12px">${data.company}</div>` : ''}
          </td>
        </tr>
        <tr><td colspan="2" style="height:8px"></td></tr>
        <tr>
          <td colspan="2">
            <table cellpadding="0" cellspacing="0" border="0">
              ${data.mobile ? `<tr><td style="padding:2px 0;color:#888;font-size:12px;width:60px;vertical-align:top">Mobile</td><td style="padding:2px 0">${data.mobile}</td></tr>` : ''}
              ${data.email ? `<tr><td style="padding:2px 0;color:#888;font-size:12px;vertical-align:top">Email</td><td style="padding:2px 0"><a href="mailto:${data.email}" style="color:${color};text-decoration:none">${data.email}</a></td></tr>` : ''}
              ${tel ? `<tr><td style="padding:2px 0;color:#888;font-size:12px;vertical-align:top">Tel</td><td style="padding:2px 0">${tel}</td></tr>` : ''}
              ${data.website ? `<tr><td style="padding:2px 0;color:#888;font-size:12px;vertical-align:top">Web</td><td style="padding:2px 0"><a href="${data.website}" style="color:${color};text-decoration:none" target="_blank">${data.website}</a></td></tr>` : ''}
              ${data.address ? `<tr><td style="padding:2px 0;color:#888;font-size:12px;vertical-align:top">Adresse</td><td style="padding:2px 0;color:#555">${data.address}</td></tr>` : ''}
            </table>
          </td>
        </tr>
        ${data.socialHtml ? `<tr><td colspan="2" style="height:6px"></td></tr><tr><td colspan="2">${data.socialHtml}</td></tr>` : ''}
        ${status ? `<tr><td colspan="2" style="height:4px"></td></tr><tr><td colspan="2" style="font-size:11px;color:#888;font-style:italic">${status}</td></tr>` : ''}
        ${data.banner ? `<tr><td colspan="2" style="height:6px"></td></tr><tr><td colspan="2" style="background:${color};color:#fff;padding:6px 10px;border-radius:4px;font-size:11px;text-align:center">${data.bannerLink ? `<a href="${data.bannerLink}" target="_blank" style="color:#fff;text-decoration:none">${data.banner}</a>` : data.banner}</td></tr>` : ''}
        ${data.qrCode ? `<tr><td colspan="2" style="height:6px"></td></tr><tr><td colspan="2"><img src="${this.getQRCodeUrl(data)}" alt="QR" style="width:60px;height:60px;border:none"></td></tr>` : ''}
        <tr><td colspan="2" style="height:6px;border-top:1px solid #ddd;padding-top:4px;font-size:9px;color:#aaa">Confidentiel</td></tr>
      </table>`;
  },

  modern(data, color, font) {
    const tel = [data.phone, data.phone2].filter(Boolean).join(' / ');
    const ff = this.getFontFamily(font);
    const status = data.dynamicStatus ? this.getDynamicStatus() : '';
    return `
      <table cellpadding="0" cellspacing="0" border="0" style="font-family:${ff};font-size:13px;color:#444;line-height:1.5;max-width:560px">
        <tr>
          <td style="background:${color};width:5px;border-radius:3px 0 0 3px"></td>
          <td style="padding:16px 18px">
            ${data.logoUrl ? `<div style="margin-bottom:8px"><img src="${data.logoUrl}" alt="Logo" style="max-height:45px;max-width:160px;"></div>` : ''}
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                ${data.photoUrl ? `<td valign="top" style="padding-right:14px"><img src="${data.photoUrl}" alt="" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid ${color}"></td>` : ''}
                <td valign="top">
                  <div style="font-size:17px;font-weight:700;color:#222">${data.firstName} ${data.lastName}</div>
                  ${data.title ? `<div style="color:${color};font-weight:500;margin:1px 0">${data.title}</div>` : ''}
                  ${data.company ? `<div style="color:#888;font-size:12px">${data.company}</div>` : ''}
                </td>
              </tr>
            </table>
            <div style="height:10px;border-top:1px solid #eee;margin:8px 0"></div>
            <table cellpadding="0" cellspacing="0" border="0">
              ${data.mobile ? `<tr><td style="padding:2px 0;font-size:12px"><span style="color:#999;width:20px;display:inline-block">📱</span>${data.mobile}</td></tr>` : ''}
              ${data.email ? `<tr><td style="padding:2px 0;font-size:12px"><span style="color:#999;width:20px;display:inline-block">✉</span><a href="mailto:${data.email}" style="color:${color};text-decoration:none">${data.email}</a></td></tr>` : ''}
              ${tel ? `<tr><td style="padding:2px 0;font-size:12px"><span style="color:#999;width:20px;display:inline-block">📞</span>${tel}</td></tr>` : ''}
              ${data.website ? `<tr><td style="padding:2px 0;font-size:12px"><span style="color:#999;width:20px;display:inline-block">🌐</span><a href="${data.website}" style="color:${color};text-decoration:none" target="_blank">${data.website}</a></td></tr>` : ''}
              ${data.address ? `<tr><td style="padding:2px 0;font-size:12px"><span style="color:#999;width:20px;display:inline-block">📍</span>${data.address}</td></tr>` : ''}
            </table>
            ${data.socialHtml ? `<div style="height:6px"></div>${data.socialHtml}` : ''}
            ${status ? `<div style="margin-top:4px;font-size:11px;color:#888;font-style:italic">${status}</div>` : ''}
            ${data.banner ? `<div style="margin-top:6px;background:${color};color:#fff;padding:5px 10px;border-radius:4px;font-size:11px;text-align:center">${data.bannerLink ? `<a href="${data.bannerLink}" target="_blank" style="color:#fff;text-decoration:none">${data.banner}</a>` : data.banner}</div>` : ''}
            ${data.qrCode ? `<div style="margin-top:6px"><img src="${this.getQRCodeUrl(data)}" alt="QR" style="width:55px;height:55px;border:none"></div>` : ''}
          </td>
        </tr>
      </table>`;
  },

  corporate(data, color, font) {
    const tel = [data.phone, data.phone2].filter(Boolean).join(' / ');
    const ff = this.getFontFamily(font);
    const companyName = data.company || (data.title && data.title.includes(',') ? data.title.split(',')[1].trim() : 'ENTREPRISE');
    const status = data.dynamicStatus ? this.getDynamicStatus() : '';
    return `
      <table cellpadding="0" cellspacing="0" border="0" style="font-family:${ff};font-size:12px;color:#444;line-height:1.4;max-width:560px">
        ${data.logoUrl ? `<tr><td colspan="2" style="padding-bottom:6px"><img src="${data.logoUrl}" alt="Logo" style="max-height:50px;max-width:180px;"></td></tr>` : ''}
        <tr>
          <td colspan="2" style="border-bottom:3px solid ${color};padding-bottom:6px">
            <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
              <td><div style="font-size:17px;font-weight:bold;color:${color}">${companyName}</div></td>
              ${data.photoUrl ? `<td align="right"><img src="${data.photoUrl}" alt="" style="width:50px;height:50px;object-fit:cover;border-radius:4px"></td>` : ''}
            </tr></table>
          </td>
        </tr>
        <tr><td colspan="2" style="height:6px"></td></tr>
        <tr>
          <td style="padding-right:18px;white-space:nowrap;min-width:160px">
            <div style="font-size:15px;font-weight:bold;color:#222">${data.firstName} ${data.lastName}</div>
            ${data.title ? `<div style="color:${color};font-weight:600;font-size:11px;margin-top:1px">${data.title}</div>` : ''}
          </td>
          <td style="border-left:1px solid ${color};padding-left:18px">
            <table cellpadding="0" cellspacing="0" border="0">
              ${data.mobile ? `<tr><td style="padding:1px 0;color:#888;font-size:11px">Mobile:</td><td style="padding:1px 0 1px 8px;font-size:11px">${data.mobile}</td></tr>` : ''}
              ${data.email ? `<tr><td style="padding:1px 0;color:#888;font-size:11px">Email:</td><td style="padding:1px 0 1px 8px;font-size:11px"><a href="mailto:${data.email}" style="color:${color};text-decoration:none">${data.email}</a></td></tr>` : ''}
              ${tel ? `<tr><td style="padding:1px 0;color:#888;font-size:11px">Tel:</td><td style="padding:1px 0 1px 8px;font-size:11px">${tel}</td></tr>` : ''}
              ${data.website ? `<tr><td style="padding:1px 0;color:#888;font-size:11px">Web:</td><td style="padding:1px 0 1px 8px;font-size:11px"><a href="${data.website}" style="color:${color};text-decoration:none" target="_blank">${data.website}</a></td></tr>` : ''}
              ${data.address ? `<tr><td style="padding:1px 0;color:#888;font-size:11px">Adresse:</td><td style="padding:1px 0 1px 8px;font-size:11px;color:#666">${data.address}</td></tr>` : ''}
            </table>
          </td>
        </tr>
        ${data.socialHtml ? `<tr><td colspan="2" style="height:4px;border-top:1px solid #eee"></td></tr><tr><td colspan="2" style="padding-top:4px">${data.socialHtml}</td></tr>` : ''}
        ${status ? `<tr><td colspan="2" style="padding-top:4px;font-size:10px;color:#888;font-style:italic">${status}</td></tr>` : ''}
        ${data.banner ? `<tr><td colspan="2" style="padding-top:6px"><div style="background:${color};color:#fff;padding:5px 10px;border-radius:4px;font-size:11px;text-align:center">${data.bannerLink ? `<a href="${data.bannerLink}" target="_blank" style="color:#fff;text-decoration:none">${data.banner}</a>` : data.banner}</div></td></tr>` : ''}
        ${data.qrCode ? `<tr><td colspan="2" style="padding-top:6px"><img src="${this.getQRCodeUrl(data)}" alt="QR" style="width:55px;height:55px;border:none"></td></tr>` : ''}
      </table>`;
  },

  render(data, templateName, color, font) {
    const fn = this[templateName] || this.classic;
    return fn.call(this, data, color, font);
  }
};
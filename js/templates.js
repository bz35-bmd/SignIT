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
        `<a href="${url}" target="_blank" style="text-decoration:none;margin:0 2px">
          <img src="${this.socialIcons[platform] || ''}" alt="${platform}" style="width:14px;height:14px;border:none;opacity:.6">
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
    return `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(vcard)}`;
  },

  getDynamicStatus() {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    if (day === 0 || day === 6) return '🟡 En ligne cette semaine';
    if (hours >= 9 && hours < 18) return '🟢 En ligne';
    return '🟡 Hors horaires de travail';
  },

  getFontFamily(font) {
    return font || 'Arial,Helvetica,sans-serif';
  },

  // ---- COMMON LAYOUT BUILDER ----
  _buildLayout(data, color, font, opts) {
    const ff = this.getFontFamily(font);
    const tel = [data.phone, data.phone2].filter(Boolean).join(' / ');
    const status = data.dynamicStatus ? this.getDynamicStatus() : '';
    const rLab = `color:#888;font-size:11px;padding-right:6px;white-space:nowrap`;

    // Left column: logo then social icons
    const left = [];
    if (data.logoUrl) {
      left.push(`<div style="margin-bottom:8px"><img src="${data.logoUrl}" alt="Logo" style="max-height:64px;max-width:180px;display:block"></div>`);
    }
    if (data.socialHtml) {
      left.push(`<div>${data.socialHtml}</div>`);
    }
    const hasLeft = left.length > 0;

    // Right column: identity + contacts
    const right = [];
    const namePart = `<span style="font-size:16px;font-weight:700;color:#1a1a1a">${data.firstName} ${data.lastName}</span>`;
    const photoPart = data.photoUrl ? `<img src="${data.photoUrl}" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-left:8px">` : '';
    right.push(`<div style="margin-bottom:1px">${namePart}${photoPart}</div>`);
    const dept = (data.department || '').trim();
    if (data.title || data.company || dept) {
      const line = [data.title, data.company].filter(Boolean).join(', ');
      const full = dept ? (line ? line + ' · ' + dept : dept) : line;
      right.push(`<div style="font-size:12px;font-weight:500;color:${color};margin:1px 0 5px 0;padding-bottom:5px;border-bottom:2px solid ${color}">${full}</div>`);
    } else {
      right.push(`<div style="margin-bottom:5px"></div>`);
    }

    const addRow = (label, value) => {
      right.push(`<div style="font-size:12px;line-height:1.6;word-break:break-word"><span style="${rLab}">${label}</span>${value}</div>`);
    };
    if (data.mobile && data.email) {
      right.push(`<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td style="font-size:12px;line-height:1.6;vertical-align:top;padding:0 10px 0 0;white-space:nowrap"><span style="color:#888;font-size:11px;padding-right:4px">Mobile</span>${data.mobile}</td>
        <td style="font-size:12px;line-height:1.6;vertical-align:top;white-space:nowrap"><span style="color:#888;font-size:11px;padding-right:4px">Email</span><a href="mailto:${data.email}" style="color:${color};text-decoration:none">${data.email}</a></td>
      </tr></table>`);
    } else {
      if (data.mobile) right.push(`<div style="font-size:12px;line-height:1.6;white-space:nowrap"><span style="color:#888;font-size:11px;padding-right:4px">Mobile</span>${data.mobile}</div>`);
      if (data.email) right.push(`<div style="font-size:12px;line-height:1.6;white-space:nowrap"><span style="color:#888;font-size:11px;padding-right:4px">Email</span><a href="mailto:${data.email}" style="color:${color};text-decoration:none">${data.email}</a></div>`);
    }
    if (tel) addRow('Tel', tel);
    if (data.phone2 && !tel) addRow('Tel', data.phone2);
    if (data.address) addRow('Adresse', `<span style="color:#666">${data.address}</span>`);
    if (data.website) addRow('Web', `<a href="${data.website}" style="color:${color};text-decoration:none" target="_blank">${data.website}</a>`);

    // Bottom marks (left to right) — table for html2canvas compatibility
    const bottom = [];
    if (status) bottom.push(`<td style="padding:0 12px 0 0;vertical-align:middle;white-space:nowrap"><span style="font-size:10px;color:#888">${status}</span></td>`);
    if (data.qrCode) bottom.push(`<td style="padding:0 8px 0 0;vertical-align:middle"><img src="${this.getQRCodeUrl(data)}" alt="QR" style="width:38px;height:38px;border:none;opacity:.8;display:block"></td>`);
    if (data.banner) bottom.push(`<td style="padding:0;vertical-align:middle"><span style="background:${hexToRgba(color, .1)};color:${color};padding:2px 8px;border-radius:3px;font-size:11px;font-weight:600;white-space:nowrap">${data.bannerLink ? `<a href="${data.bannerLink}" target="_blank" style="color:${color};text-decoration:none">${data.banner}</a>` : data.banner}</span></td>`);

    const wrap = opts.wrap || (s => s);
    const mainStyle = `font-family:${ff};font-size:13px;color:#333;${opts.tableStyle || ''}`;

    return wrap(`
      <table cellpadding="0" cellspacing="0" border="0" style="${mainStyle}">
        <tr>
          ${hasLeft ? `<td valign="top" style="padding-right:16px;${opts.leftStyle || ''}">${left.join('')}</td>` : ''}
          <td valign="top" style="${opts.rightStyle || ''}">
            ${right.join('')}
          </td>
        </tr>
        ${bottom.length ? `<tr><td colspan="${hasLeft ? 2 : 1}" style="padding-top:6px;border-top:1px solid #eee"><table cellpadding="0" cellspacing="0" border="0"><tr>${bottom.join('')}</tr></table></td></tr>` : ''}
      </table>
    `);
  },

  classic(data, color, font) {
    return this._buildLayout(data, color, font, { tableStyle: 'max-width:640px' });
  },

  modern(data, color, font) {
    return this._buildLayout(data, color, font, {
      tableStyle: 'max-width:620px;border:1px solid #e8e8e8;border-radius:6px',
      leftStyle: `background:${hexToRgba(color, .06)};padding:10px 12px;border-radius:4px;`,
      rightStyle: `padding-left:2px`,
    });
  },

  corporate(data, color, font) {
    const companyName = data.company || 'ENTREPRISE';
    return this._buildLayout(data, color, font, {
      tableStyle: 'max-width:640px;border:1px solid #ddd;border-radius:6px',
      wrap: s => `<table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="border-top:3px solid ${color};padding:0 18px">
          <div style="border-bottom:1px solid #eee;padding:10px 0 6px;font-size:11px;font-weight:700;color:${color};letter-spacing:.5px">${companyName}</div>
        </td></tr>
        <tr><td style="padding:10px 18px 14px">${s}</td></tr>
      </table>`,
    });
  },

  render(data, templateName, color, font) {
    const fn = this[templateName] || this.classic;
    return fn.call(this, data, color, font);
  }
};

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
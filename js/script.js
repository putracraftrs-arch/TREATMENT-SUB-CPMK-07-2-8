/* =========================================================
   Portal Layanan Mahasiswa — script.js
   Logika bersama untuk halaman formulir (index.html) dan
   halaman data (data.html). Data disimpan di localStorage
   supaya kedua halaman selalu menampilkan data yang sama
   tanpa perlu server/backend.
   ========================================================= */

const STORAGE_KEY = "layananData";

/* ---------- Helper: akses data di localStorage ---------- */

function getData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Data tersimpan rusak, mengembalikan array kosong.", err);
    return [];
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateTicketId(existingData) {
  const nextNumber = existingData.length + 1;
  return "LYN-" + String(nextNumber).padStart(4, "0");
}

function formatTanggal(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function jenisToBadgeClass(jenis) {
  const map = {
    "Cuti Akademik": "type-cuti",
    "Legalisir Ijazah": "type-legalisir",
    "Surat Rekomendasi": "type-rekomendasi",
  };
  return map[jenis] || "";
}

/* =========================================================
   Halaman Formulir (index.html)
   ========================================================= */

function initFormPage() {
  const form = document.getElementById("service-form");
  if (!form) return; // Bukan halaman formulir, keluar.

  const namaInput = document.getElementById("nama");
  const nimInput = document.getElementById("nim");
  const jenisSelect = document.getElementById("jenis");
  const keteranganInput = document.getElementById("keterangan");

  const previewId = document.getElementById("preview-id");
  const previewNama = document.getElementById("preview-nama");
  const previewNim = document.getElementById("preview-nim");
  const previewJenis = document.getElementById("preview-jenis");

  const toast = document.getElementById("toast");

  // Tampilkan nomor tiket berikutnya sejak halaman dimuat.
  function refreshPreviewId() {
    previewId.textContent = generateTicketId(getData());
  }
  refreshPreviewId();

  // Pratinjau tiket diperbarui setiap kali pengguna mengetik,
  // tanpa perlu mengirim form terlebih dahulu.
  function updatePreviewField(el, value, placeholder) {
    if (value && value.trim() !== "") {
      el.textContent = value;
      el.classList.remove("is-placeholder");
    } else {
      el.textContent = placeholder;
      el.classList.add("is-placeholder");
    }
  }

  namaInput.addEventListener("input", () => {
    updatePreviewField(previewNama, namaInput.value, "Belum diisi");
  });

  nimInput.addEventListener("input", () => {
    updatePreviewField(previewNim, nimInput.value, "Belum diisi");
  });

  jenisSelect.addEventListener("change", () => {
    updatePreviewField(previewJenis, jenisSelect.value, "Belum dipilih");
  });

  // Validasi sederhana: tandai field kosong sebagai error.
  function setFieldError(fieldId, hasError) {
    const field = document.getElementById(fieldId);
    field.classList.toggle("has-error", hasError);
  }

  function validateForm() {
    let isValid = true;

    if (namaInput.value.trim() === "") {
      setFieldError("field-nama", true);
      isValid = false;
    } else {
      setFieldError("field-nama", false);
    }

    if (nimInput.value.trim() === "") {
      setFieldError("field-nim", true);
      isValid = false;
    } else {
      setFieldError("field-nim", false);
    }

    if (jenisSelect.value === "") {
      setFieldError("field-jenis", true);
      isValid = false;
    } else {
      setFieldError("field-jenis", false);
    }

    return isValid;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data = getData();
    const newEntry = {
      id: generateTicketId(data),
      nama: namaInput.value.trim(),
      nim: nimInput.value.trim(),
      jenis: jenisSelect.value,
      keterangan: keteranganInput.value.trim(),
      tanggal: new Date().toISOString(),
    };

    data.push(newEntry);
    saveData(data);

    showToast(`Tiket ${newEntry.id} berhasil dikirim.`);

    form.reset();
    updatePreviewField(previewNama, "", "Belum diisi");
    updatePreviewField(previewNim, "", "Belum diisi");
    updatePreviewField(previewJenis, "", "Belum dipilih");
    refreshPreviewId();
  });

  form.addEventListener("reset", () => {
    // Bersihkan status error saat pengguna menekan tombol "Bersihkan".
    ["field-nama", "field-nim", "field-jenis"].forEach((id) =>
      setFieldError(id, false)
    );
  });
}

/* =========================================================
   Halaman Data (data.html)
   ========================================================= */

function initDataPage() {
  const tableBody = document.getElementById("table-body");
  if (!tableBody) return; // Bukan halaman data, keluar.

  const emptyState = document.getElementById("empty-state");
  const tableCount = document.getElementById("table-count");
  const searchInput = document.getElementById("search-input");

  function renderTable(filterText = "") {
    const data = getData();
    const keyword = filterText.trim().toLowerCase();

    const filtered = keyword
      ? data.filter((entry) =>
          [entry.nama, entry.nim, entry.jenis]
            .join(" ")
            .toLowerCase()
            .includes(keyword)
        )
      : data;

    tableBody.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.hidden = data.length !== 0; // hanya tampil jika memang tidak ada data sama sekali
      tableCount.textContent = keyword
        ? "0 hasil ditemukan"
        : "0 data";
      if (keyword && data.length > 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--color-muted); padding: 32px;">Tidak ada hasil untuk "${escapeHtml(filterText)}"</td></tr>`;
      }
      return;
    }

    emptyState.hidden = true;
    tableCount.textContent = `${filtered.length} data`;

    filtered.forEach((entry, index) => {
      const row = document.createElement("tr");
      const badgeClass = jenisToBadgeClass(entry.jenis);

      row.innerHTML = `
        <td>${index + 1}</td>
        <td class="mono">${escapeHtml(entry.id)}</td>
        <td>${escapeHtml(entry.nama)}</td>
        <td class="mono">${escapeHtml(entry.nim)}</td>
        <td><span class="badge ${badgeClass}">${escapeHtml(entry.jenis)}</span></td>
        <td>${escapeHtml(entry.keterangan) || "—"}</td>
        <td>${formatTanggal(entry.tanggal)}</td>
        <td><button class="row-delete" data-id="${escapeHtml(entry.id)}">Hapus</button></td>
      `;

      tableBody.appendChild(row);
    });

    // Pasang event listener untuk setiap tombol hapus.
    tableBody.querySelectorAll(".row-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        deleteEntry(id);
        renderTable(searchInput.value);
      });
    });
  }

  function deleteEntry(id) {
    const data = getData().filter((entry) => entry.id !== id);
    saveData(data);
  }

  // Cegah karakter yang bisa merusak HTML saat data ditampilkan.
  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (char) => {
      const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return map[char];
    });
  }

  searchInput.addEventListener("input", () => {
    renderTable(searchInput.value);
  });

  renderTable();
}

/* ---------- Jalankan sesuai halaman yang aktif ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initFormPage();
  initDataPage();
});

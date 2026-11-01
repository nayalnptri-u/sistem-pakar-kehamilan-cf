// Data Gejala dan Nilai CF Pakar dari Tabel Dataset
const gejalaList = [
    { no: 1, kode: "KH1", nama: "Terlambat Menstruasi", cfPakar: 0.4 },
    { no: 2, kode: "KH2", nama: "Detak Jantung Janin", cfPakar: 1.0 },
    { no: 3, kode: "KH3", nama: "Flex / Pendarahan ringan", cfPakar: 0.0 },
    { no: 4, kode: "KH4", nama: "Nyeri / Bengkak pada Payudara", cfPakar: 0.4 },
    { no: 5, kode: "KH5", nama: "Gerakan Janin", cfPakar: 1.0 },
    { no: 6, kode: "KH6", nama: "Mual dan Muntah", cfPakar: 0.4 },
    { no: 7, kode: "KH7", nama: "Mudah Lelah", cfPakar: 0.4 },
    { no: 8, kode: "KH8", nama: "Sudah ada Kantong Janin", cfPakar: 1.0 },
    { no: 9, kode: "KH9", nama: "Sensitif terhadap bau", cfPakar: 0.4 },
    { no: 10, kode: "KH10", nama: "Kram perut ringan", cfPakar: 0.2 },
    { no: 11, kode: "KH11", nama: "Teraba Janin", cfPakar: 1.0 },
    { no: 12, kode: "KH12", nama: "Testpack Positif", cfPakar: 0.6 },
    { no: 13, kode: "KH13", nama: "Hasil USG", cfPakar: 1.0 },
    { no: 14, kode: "KH14", nama: "Sering buang air kecil", cfPakar: 0.4 }
];

// Opsi Skala Kepastian User
const skalaUserOptions = [
    { label: "Sangat Yakin (1.0)", value: 1.0 },
    { label: "Yakin (0.8)", value: 0.8 },
    { label: "Cukup Yakin (0.6)", value: 0.6 },
    { label: "Kurang Yakin (0.4)", value: 0.4 },
    { label: "Tidak Tahu (0.2)", value: 0.2 },
    { label: "Tidak Tahu / Tidak Dirasakan (0.0)", value: 0.0 }
];

document.addEventListener("DOMContentLoaded", () => {
    renderGejalaTable();
    
    document.getElementById("cfForm").addEventListener("submit", function(e) {
        e.preventDefault();
        calculateCF();
    });
});

function renderGejalaTable() {
    const tbody = document.getElementById("gejalaTableBody");
    tbody.innerHTML = "";

    gejalaList.forEach((g) => {
        const tr = document.createElement("tr");

        let selectOptions = skalaUserOptions.map(opt => 
            `<option value="${opt.value}">${opt.label}</option>`
        ).join("");

        tr.innerHTML = `
            <td>${g.no}</td>
            <td><strong>${g.kode}</strong></td>
            <td>${g.nama}</td>
            <td><span class="badge" style="background-color: #0284c7;">${g.cfPakar}</span></td>
            <td>
                <select name="cf_user_${g.kode}" data-kode="${g.kode}">
                    ${selectOptions}
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function calculateCF() {
    const userName = document.getElementById("userName").value.trim();
    const userAge = document.getElementById("userAge").value.trim();

    if (!userName || !userAge) {
        alert("Silakan isi nama lengkap dan usia pasien terlebih dahulu.");
        return;
    }

    let activeCFs = [];
    let logText = `=== LAPORAN PERHITUNGAN CERTAINTY FACTOR (CF) ===\n`;
    logText += `Nama Pasien : ${userName}\nUsia Pasien : ${userAge} Tahun\n\n`;
    logText += `1. PERHITUNGAN CF(H,E) = CF(User) * CF(Pakar):\n`;

    gejalaList.forEach(g => {
        const selectEl = document.querySelector(`select[data-kode="${g.kode}"]`);
        const cfUser = parseFloat(selectEl.value);

        if (cfUser > 0 && g.cfPakar > 0) {
            const cfHE = cfUser * g.cfPakar;
            activeCFs.push({
                kode: g.kode,
                nama: g.nama,
                cfUser: cfUser,
                cfPakar: g.cfPakar,
                cfHE: cfHE
            });
            logText += `• [${g.kode}] ${g.nama}: CF_User(${cfUser}) * CF_Pakar(${g.cfPakar}) = ${cfHE.toFixed(4)}\n`;
        }
    });

    if (activeCFs.length === 0) {
        alert("Silakan pilih minimal satu gejala dengan tingkat keyakinan > 0.");
        return;
    }

    logText += `\n2. AKUMULASI KOMBINASI (CF Combined):\n`;
    
    let cfCombine = activeCFs[0].cfHE;
    logText += `• Awal: CF_Combine = CF[${activeCFs[0].kode}] = ${cfCombine.toFixed(4)}\n`;

    for (let i = 1; i < activeCFs.length; i++) {
        const cfNext = activeCFs[i].cfHE;
        const oldCombine = cfCombine;
        cfCombine = oldCombine + cfNext * (1 - oldCombine);
        logText += `• Kombinasi ke-${i}: CF_Old(${oldCombine.toFixed(4)}) + CF_Next(${cfNext.toFixed(4)}) * (1 - ${oldCombine.toFixed(4)}) = ${cfCombine.toFixed(4)}\n`;
    }

    const percentage = (cfCombine * 100).toFixed(2);
    logText += `\n3. HASIL AKHIR:\n• CF Total = ${cfCombine.toFixed(4)}\n• Persentase = ${percentage}%\n`;

    displayResults(userName, userAge, cfCombine, percentage, logText);
}

function displayResults(name, age, cfCombine, percentage, logText) {
    const resultCard = document.getElementById("resultCard");
    const percentageVal = document.getElementById("percentageVal");
    const cfDetailText = document.getElementById("cfDetailText");
    const progressBar = document.getElementById("progressBar");
    const statusBadge = document.getElementById("statusBadge");
    const suggestionText = document.getElementById("suggestionText");
    const logContent = document.getElementById("logContent");

    // Tanggal Diagnosa
    const today = new Date();
    const formattedDate = today.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Isi Informasi Pasien pada Hasil
    document.getElementById("resName").innerText = name;
    document.getElementById("resAge").innerText = `${age} Tahun`;
    document.getElementById("resDate").innerText = formattedDate;

    resultCard.classList.remove("hidden");
    percentageVal.innerText = `${percentage}%`;
    cfDetailText.innerHTML = `Nilai Kombinasi CF Akhir: <b>${cfCombine.toFixed(4)}</b>`;
    progressBar.style.width = `${percentage}%`;
    logContent.innerText = logText;

    // Status Kepastian dan Saran Medis
    if (cfCombine >= 0.8) {
        statusBadge.innerText = "Tingkat Kepastian Sangat Tinggi";
        statusBadge.className = "badge badge-high";
        suggestionText.innerText = `Pasien atas nama ${name} (${age} th) memiliki indikasi kehamilan yang sangat kuat. Disarankan untuk segera melakukan pemeriksaan medis konfirmasi ke dokter spesialis kandungan (Sp.OG) atau bidan terdekat.`;
    } else if (cfCombine >= 0.5) {
        statusBadge.innerText = "Tingkat Kepastian Sedang";
        statusBadge.className = "badge badge-medium";
        suggestionText.innerText = `Pasien atas nama ${name} (${age} th) memiliki beberapa indikasi awal kehamilan. Disarankan untuk mengulang tes mandiri (Testpack) dalam 3-5 hari ke depan di pagi hari atau berkonsultasi ke layanan kesehatan.`;
    } else {
        statusBadge.innerText = "Tingkat Kepastian Rendah";
        statusBadge.className = "badge badge-low";
        suggestionText.innerText = `Indikasi kehamilan pada pasien ${name} (${age} th) tergolong rendah. Gejala yang dirasakan kemungkinan disebabkan faktor fisiologis lain atau perubahan hormonal harian.`;
    }

    resultCard.scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    document.getElementById("cfForm").reset();
    document.getElementById("resultCard").classList.add("hidden");
}

function toggleBreakdown() {
    const content = document.getElementById("breakdownContent");
    const icon = document.getElementById("accordionIcon");
    
    content.classList.toggle("hidden");
    if (content.classList.contains("hidden")) {
        icon.className = "fa-solid fa-chevron-down";
    } else {
        icon.className = "fa-solid fa-chevron-up";
    }
}

// script.js - Sistema Estacionamento Friendly
import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Aguarda o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚗 Sistema Estacionamento Friendly carregado!");
    inicializarSistema();
    configurarInputsMaiusculos();
});

function inicializarSistema() {
    console.log("🔧 Inicializando sistema...");
    
    // Entrada de veículo
    const formEntrada = document.getElementById('formEntrada');
    if (formEntrada) {
        formEntrada.addEventListener('submit', registrarEntrada);
        console.log("✅ Formulário de entrada configurado");
    } else {
        console.log("❌ Formulário de entrada não encontrado");
    }

    // Saída de veículo
    const formSaida = document.getElementById('formSaida');
    if (formSaida) {
        formSaida.addEventListener('submit', registrarSaida);
        console.log("✅ Formulário de saída configurado");
    } else {
        console.log("❌ Formulário de saída não encontrado");
    }

    // Buscar veículo
    const btnBuscar = document.getElementById('btnBuscar');
    if (btnBuscar) {
        btnBuscar.addEventListener('click', buscarVeiculo);
        console.log("✅ Botão de busca configurado");
    } else {
        console.log("❌ Botão de busca não encontrado");
    }

    // Carregar dados iniciais
    carregarVagasOcupadas();
    carregarRelatorio();
}

// CONFIGURAR INPUTS PARA MAIÚSCULAS - VERSÃO SIMPLES E FUNCIONAL
function configurarInputsMaiusculos() {
    console.log("🔠 Configurando inputs para maiúsculas...");
    
    const inputsMaiusculos = [
        'placaEntrada', 'modeloEntrada', 'corEntrada', 'vagaEntrada',
        'placaSaida', 'placaBusca'
    ];

    inputsMaiusculos.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            // Converter para maiúsculo ao digitar
            input.addEventListener('input', function(e) {
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                e.target.value = e.target.value.toUpperCase();
                e.target.setSelectionRange(start, end);
            });

            // Converter para maiúsculo ao colar
            input.addEventListener('paste', function(e) {
                setTimeout(() => {
                    e.target.value = e.target.value.toUpperCase();
                }, 0);
            });

            // Converter para maiúsculo ao perder o foco
            input.addEventListener('blur', function(e) {
                e.target.value = e.target.value.toUpperCase();
            });

            console.log(`✅ Input configurado: ${id}`);
        } else {
            console.log(`⚠️ Input não encontrado: ${id}`);
        }
    });
}

const VAGAS = [
    'A1',
    'A2',
    'A3',
    'A4',
    'A5',
    'A6',
    'A7',
    'A8',
    'A9',
    'A10'
];

async function encontrarPrimeiraVagaDisponivel() {
    const q = query(
        collection(db, "estacionamento"),
        where("status", "==", "estacionado")
    );

    const querySnapshot = await getDocs(q);

    const vagasOcupadas = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();

        if (data.vaga) {
            vagasOcupadas.push(data.vaga);
        }
    });

    const primeiraVagaLivre = VAGAS.find(
        vaga => !vagasOcupadas.includes(vaga)
    );

    return primeiraVagaLivre || null;
}

// REGISTRAR ENTRADA DE VEÍCULO
async function registrarEntrada(e) {
    e.preventDefault();
    console.log("📝 Registrando entrada de veículo...");
    
    // Obter valores e converter para maiúsculo
    const placa = document.getElementById('placaEntrada').value.toUpperCase().replace(/-/g, '');
    const modelo = document.getElementById('modeloEntrada').value.toUpperCase();
    const cor = document.getElementById('corEntrada').value.toUpperCase();
    

    console.log("Dados recebidos:", { placa, modelo, cor, });

    // Validações
    if (!placa || !modelo || !cor ) {
        alert('⚠️ Preencha todos os campos!');
        return;
    }

   const vaga = await encontrarPrimeiraVagaDisponivel();

   if (!vaga) {
    alert('❌ Não há vagas disponíveis!');
    return;
}
       const campoVaga = document.getElementById('vagaEntrada');

   if (campoVaga) {
       campoVaga.value = vaga;
}

    try {
        // Verificar se a vaga está ocupada
        const vagaOcupada = await verificarVagaOcupada(vaga);
        if (vagaOcupada) {
            alert(`❌ Vaga ${vaga} já está ocupada!`);
            return;
        }

        // Verificar se veículo já está estacionado
        const veiculoEstacionado = await verificarVeiculoEstacionado(placa);
        if (veiculoEstacionado) {
            alert(`❌ Veículo com placa ${placa} já está estacionado!`);
            return;
        }

        // Criar registro de entrada
        const registroEntrada = {
            placa: placa,
            modelo: modelo,
            cor: cor,
            vaga: vaga,
            dataEntrada: serverTimestamp(),
            status: 'estacionado',
            tipo: 'entrada'
        };

        // Salvar no Firestore
        const docRef = await addDoc(collection(db, "estacionamento"), registroEntrada);
        
        console.log("✅ Entrada registrada com ID: ", docRef.id);
        alert(`✅ Entrada registrada!\nVeículo: ${placa}\nVaga: ${vaga}\nModelo: ${modelo}`);
        
        // Limpar formulário e atualizar interface
        e.target.reset();
        carregarVagasOcupadas();
        carregarRelatorio();
        
    } catch (error) {
        console.error("❌ Erro ao registrar entrada:", error);
        alert("❌ Erro ao registrar entrada: " + error.message);
    }
}

// REGISTRAR SAÍDA DE VEÍCULO
async function registrarSaida(e) {
    e.preventDefault();
    console.log("🚙 Registrando saída de veículo...");
    
    const placa = document.getElementById('placaSaida').value.toUpperCase().replace(/-/g, '');

    if (!placa) {
        alert('⚠️ Digite a placa do veículo!');
        return;
    }

    try {
        // Buscar veículo estacionado
        const veiculo = await buscarVeiculoEstacionado(placa);
        
        if (!veiculo) {
            alert(`❌ Veículo com placa ${placa} não encontrado ou já saiu!`);
            return;
        }

        // Calcular tempo e valor
        const tempoEstacionado = calcularTempoEstacionado(veiculo.dataEntrada);
        const valorCobrado = calcularValor(tempoEstacionado);

        // Atualizar registro com saída
        const registroRef = doc(db, "estacionamento", veiculo.id);
        await updateDoc(registroRef, {
            dataSaida: serverTimestamp(),
            status: 'finalizado',
            tempoEstacionado: tempoEstacionado,
            valorCobrado: valorCobrado,
            tipo: 'saída'
        });

        // Exibir recibo
        exibirRecibo(veiculo, tempoEstacionado, valorCobrado);
        
        console.log("✅ Saída registrada: ", placa);
        
        // Limpar formulário e atualizar interface
        e.target.reset();
        carregarVagasOcupadas();
        carregarRelatorio();
        
    } catch (error) {
        console.error("❌ Erro ao registrar saída:", error);
        alert("❌ Erro ao registrar saída: " + error.message);
    }
}

// BUSCAR VEÍCULO
async function buscarVeiculo() {
    const placa = document.getElementById('placaBusca').value.toUpperCase().replace(/-/g, '');
    const resultadoDiv = document.getElementById('resultadoBusca');

    if (!placa) {
        resultadoDiv.innerHTML = '<div class="erro">⚠️ Digite uma placa para buscar</div>';
        return;
    }

    try {
        const veiculo = await buscarVeiculoEstacionado(placa);
        
        if (veiculo) {
            const tempo = calcularTempoEstacionado(veiculo.dataEntrada);
            resultadoDiv.innerHTML = `
                <div class="info-veiculo">
                    <h3>✅ Veículo Encontrado</h3>
                    <p><strong>Placa:</strong> ${formatarPlaca(veiculo.placa)}</p>
                    <p><strong>Modelo:</strong> ${veiculo.modelo}</p>
                    <p><strong>Cor:</strong> ${veiculo.cor}</p>
                    <p><strong>Vaga:</strong> ${veiculo.vaga}</p>
                    <p><strong>Tempo estacionado:</strong> ${tempo}</p>
                    <p><strong>Status:</strong> 🅿️ Estacionado</p>
                </div>
            `;
        } else {
            resultadoDiv.innerHTML = '<div class="aviso">❌ Veículo não encontrado ou já saiu</div>';
        }
    } catch (error) {
        console.error("❌ Erro ao buscar veículo:", error);
        resultadoDiv.innerHTML = '<div class="erro">❌ Erro na busca: ' + error.message + '</div>';
    }
}

// CARREGAR VAGAS OCUPADAS
async function carregarVagasOcupadas() {
    const vagasDiv = document.getElementById('vagasOcupadas');
    if (!vagasDiv) return;

    try {
        const q = query(
            collection(db, "estacionamento"),
            where("status", "==", "estacionado"),
            orderBy("vaga", "asc")
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            vagasDiv.innerHTML = '<h3>📍 Vagas Ocupadas</h3><p>✅ Nenhuma vaga ocupada no momento</p>';
            return;
        }

        let html = '<h3>📍 Vagas Ocupadas</h3>';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const tempo = calcularTempoEstacionado(data.dataEntrada);
            
            html += `
                <div class="vaga-item">
                    <strong>📍 Vaga ${data.vaga}</strong><br>
                    🚘 <strong>${formatarPlaca(data.placa)}</strong><br>
                    🚗 ${data.modelo} • 🎨 ${data.cor}<br>
                    ⏰ ${tempo}
                </div>
            `;
        });
        
        vagasDiv.innerHTML = html;
        
    } catch (error) {
        console.error("❌ Erro ao carregar vagas:", error);
        vagasDiv.innerHTML = '<h3>📍 Vagas Ocupadas</h3><div class="erro">❌ Erro ao carregar vagas</div>';
    }
}

// CARREGAR RELATÓRIO DO DIA
async function carregarRelatorio() {
    const relatorioDiv = document.getElementById('relatorioDia');
    if (!relatorioDiv) return;

    try {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const q = query(
            collection(db, "estacionamento"),
            where("dataEntrada", ">=", hoje),
            orderBy("dataEntrada", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        
        let totalEntradas = 0;
        let totalReceita = 0;
        let veiculosEstacionados = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalEntradas++;
            
            if (data.status === 'estacionado') {
                veiculosEstacionados++;
            }
            
            if (data.valorCobrado) {
                totalReceita += data.valorCobrado;
            }
        });

        relatorioDiv.innerHTML = `
            <h3>📊 Relatório do Dia</h3>
            <div class="relatorio-item">
                <p>🚗 <strong>Entradas:</strong> ${totalEntradas}</p>
                <p>🅿️ <strong>Estacionados:</strong> ${veiculosEstacionados}</p>
                <p>💰 <strong>Receita:</strong> R$ ${totalReceita.toFixed(2)}</p>
                <p>📅 <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
        `;
        
    } catch (error) {
        console.error("❌ Erro ao carregar relatório:", error);
        relatorioDiv.innerHTML = '<h3>📊 Relatório do Dia</h3><div class="erro">❌ Erro ao carregar relatório</div>';
    }
}

// FUNÇÕES AUXILIARES

// VALIDAR PLACA (Mercosul e antigo)
function validarPlaca(placa) {
    // Remove qualquer hífen
    const placaLimpa = placa.replace(/-/g, '');
    
    // Formato Mercosul: ABC1D23
    const regexMercosul = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;
    
    // Formato Antigo: ABC1234
    const regexAntigo = /^[A-Z]{3}[0-9]{4}$/;
    
    return regexMercosul.test(placaLimpa) || regexAntigo.test(placaLimpa);
}

// FORMATAR PLACA PARA EXIBIÇÃO
function formatarPlaca(placa) {
    const placaLimpa = placa.replace(/-/g, '');
    
    if (placaLimpa.length === 7) {
        // Formato Mercosul: ABC1D23 -> ABC-1D23
        if (/^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/.test(placaLimpa)) {
            return placaLimpa.slice(0, 3) + '-' + placaLimpa.slice(3);
        }
        // Formato Antigo: ABC1234 -> ABC-1234
        else if (/^[A-Z]{3}[0-9]{4}$/.test(placaLimpa)) {
            return placaLimpa.slice(0, 3) + '-' + placaLimpa.slice(3);
        }
    }
    
    return placa;
}

// VERIFICAR SE VAGA ESTÁ OCUPADA
async function verificarVagaOcupada(vaga) {
    const q = query(
        collection(db, "estacionamento"),
        where("vaga", "==", vaga),
        where("status", "==", "estacionado")
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

// VERIFICAR SE VEÍCULO JÁ ESTÁ ESTACIONADO
async function verificarVeiculoEstacionado(placa) {
    const q = query(
        collection(db, "estacionamento"),
        where("placa", "==", placa),
        where("status", "==", "estacionado")
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

// BUSCAR VEÍCULO ESTACIONADO
async function buscarVeiculoEstacionado(placa) {
    const q = query(
        collection(db, "estacionamento"),
        where("placa", "==", placa),
        where("status", "==", "estacionado")
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }
    return null;
}

// CALCULAR TEMPO ESTACIONADO
function calcularTempoEstacionado(dataEntrada) {
    if (!dataEntrada) return "0 min";
    
    const entrada = dataEntrada.toDate ? dataEntrada.toDate() : new Date(dataEntrada);
    const agora = new Date();
    const diffMs = agora - entrada;
    
    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas === 0) {
        return `${minutos} min`;
    } else if (minutos === 0) {
        return `${horas}h`;
    }
    return `${horas}h ${minutos}min`;
}

// CALCULAR VALOR (R$ 5,00 por hora - fração cobrada como hora cheia)
function calcularValor(tempoString) {
    // Extrair horas e minutos da string
    const match = tempoString.match(/(\d+)h\s*(\d+)min/);
    
    let horasTotais = 0;
    
    if (match) {
        const horas = parseInt(match[1]);
        const minutos = parseInt(match[2]);
        horasTotais = horas + (minutos / 60);
    } else {
        // Se não conseguir parsear, assume pelo menos 1 hora
        const onlyHours = tempoString.match(/(\d+)h/);
        if (onlyHours) {
            horasTotais = parseInt(onlyHours[1]);
        } else {
            const onlyMinutes = tempoString.match(/(\d+)min/);
            if (onlyMinutes) {
                horasTotais = parseInt(onlyMinutes[1]) / 60;
            } else {
                // Valor mínimo
                return 5.00;
            }
        }
    }
    
    const valorPorHora = 5.00;
    
    // Cobrar fração de hora como hora cheia (mínimo 1 hora)
    const horasCobradas = Math.max(1, Math.ceil(horasTotais));
    
    return horasCobradas * valorPorHora;
}

// EXIBIR RECIBO
function exibirRecibo(veiculo, tempo, valor) {
    const reciboDiv = document.getElementById('recibo');
    if (!reciboDiv) return;

    reciboDiv.innerHTML = `
        <div class="recibo">
            <h3>📄 RECIBO DE ESTACIONAMENTO</h3>
            <p><strong>PLACA:</strong> ${formatarPlaca(veiculo.placa)}</p>
            <p><strong>MODELO:</strong> ${veiculo.modelo}</p>
            <p><strong>COR:</strong> ${veiculo.cor}</p>
            <p><strong>VAGA:</strong> ${veiculo.vaga}</p>
            <p><strong>TEMPO ESTACIONADO:</strong> ${tempo}</p>
            <p><strong>VALOR COBRADO:</strong> R$ ${valor.toFixed(2)}</p>
            <p><strong>DATA/HORA DE SAÍDA:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <hr>
            <p style="text-align: center; font-weight: bold;">🎉 OBRIGADO PELA PREFERÊNCIA! 🎉</p>
        </div>
    `;
    
    // Auto-remove após 15 segundos
    setTimeout(() => {
        reciboDiv.innerHTML = '';
    }, 15000);
}

// EXPORTAR FUNÇÕES PARA USO GLOBAL
window.registrarEntrada = registrarEntrada;
window.registrarSaida = registrarSaida;
window.buscarVeiculo = buscarVeiculo;

console.log("📜 Script.js carregado com sucesso!");

    try {
        // Verificar se a vaga está ocupada
        const vagaOcupada = await verificarVagaOcupada(vaga);
        if (vagaOcupada) {
            alert(`❌ Vaga ${vaga} já está ocupada!`);
            return;
        }

        // Verificar se veículo já está estacionado
        const veiculoEstacionado = await verificarVeiculoEstacionado(placa);
        if (veiculoEstacionado) {
            alert(`❌ Veículo com placa ${placa} já está estacionado!`);
            return;
        }

        // Criar registro de entrada
        const registroEntrada = {
            placa: placa,
            modelo: modelo,
            cor: cor,
            vaga: vaga,
            dataEntrada: serverTimestamp(),
            status: 'estacionado',
            tipo: 'entrada'
        };

        // Salvar no Firestore
        const docRef = await addDoc(collection(db, "estacionamento"), registroEntrada);
        
        console.log("✅ Entrada registrada com ID: ", docRef.id);
        alert(`✅ Entrada registrada!\nVeículo: ${placa}\nVaga: ${vaga}\nModelo: ${modelo}`);
        
        // Limpar formulário e atualizar interface
        e.target.reset();
        carregarVagasOcupadas();
        carregarRelatorio();
        
    } catch (error) {
        console.error("❌ Erro ao registrar entrada:", error);
        alert("❌ Erro ao registrar entrada: " + error.message);
    }
}

// REGISTRAR SAÍDA DE VEÍCULO
async function registrarSaida(e) {
    e.preventDefault();
    console.log("🚙 Registrando saída de veículo...");
    
    const placa = document.getElementById('placaSaida').value.toUpperCase().replace(/-/g, '');

    if (!placa) {
        alert('⚠️ Digite a placa do veículo!');
        return;
    }

    try {
        // Buscar veículo estacionado
        const veiculo = await buscarVeiculoEstacionado(placa);
        
        if (!veiculo) {
            alert(`❌ Veículo com placa ${placa} não encontrado ou já saiu!`);
            return;
        }

        // Calcular tempo e valor
        const tempoEstacionado = calcularTempoEstacionado(veiculo.dataEntrada);
        const valorCobrado = calcularValor(tempoEstacionado);

        // Atualizar registro com saída
        const registroRef = doc(db, "estacionamento", veiculo.id);
        await updateDoc(registroRef, {
            dataSaida: serverTimestamp(),
            status: 'finalizado',
            tempoEstacionado: tempoEstacionado,
            valorCobrado: valorCobrado,
            tipo: 'saída'
        });

        // Exibir recibo
        exibirRecibo(veiculo, tempoEstacionado, valorCobrado);
        
        console.log("✅ Saída registrada: ", placa);
        
        // Limpar formulário e atualizar interface
        e.target.reset();
        carregarVagasOcupadas();
        carregarRelatorio();
        
    } catch (error) {
        console.error("❌ Erro ao registrar saída:", error);
        alert("❌ Erro ao registrar saída: " + error.message);
    }
}

// BUSCAR VEÍCULO
async function buscarVeiculo() {
    const placa = document.getElementById('placaBusca').value.toUpperCase().replace(/-/g, '');
    const resultadoDiv = document.getElementById('resultadoBusca');

    if (!placa) {
        resultadoDiv.innerHTML = '<div class="erro">⚠️ Digite uma placa para buscar</div>';
        return;
    }

    try {
        const veiculo = await buscarVeiculoEstacionado(placa);
        
        if (veiculo) {
            const tempo = calcularTempoEstacionado(veiculo.dataEntrada);
            resultadoDiv.innerHTML = `
                <div class="info-veiculo">
                    <h3>✅ Veículo Encontrado</h3>
                    <p><strong>Placa:</strong> ${formatarPlaca(veiculo.placa)}</p>
                    <p><strong>Modelo:</strong> ${veiculo.modelo}</p>
                    <p><strong>Cor:</strong> ${veiculo.cor}</p>
                    <p><strong>Vaga:</strong> ${veiculo.vaga}</p>
                    <p><strong>Tempo estacionado:</strong> ${tempo}</p>
                    <p><strong>Status:</strong> 🅿️ Estacionado</p>
                </div>
            `;
        } else {
            resultadoDiv.innerHTML = '<div class="aviso">❌ Veículo não encontrado ou já saiu</div>';
        }
    } catch (error) {
        console.error("❌ Erro ao buscar veículo:", error);
        resultadoDiv.innerHTML = '<div class="erro">❌ Erro na busca: ' + error.message + '</div>';
    }
}

// CARREGAR VAGAS OCUPADAS
async function carregarVagasOcupadas() {
    const vagasDiv = document.getElementById('vagasOcupadas');
    if (!vagasDiv) return;

    try {
        const q = query(
            collection(db, "estacionamento"),
            where("status", "==", "estacionado"),
            orderBy("vaga", "asc")
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            vagasDiv.innerHTML = '<h3>📍 Vagas Ocupadas</h3><p>✅ Nenhuma vaga ocupada no momento</p>';
            return;
        }

        let html = '<h3>📍 Vagas Ocupadas</h3>';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const tempo = calcularTempoEstacionado(data.dataEntrada);
            
            html += `
                <div class="vaga-item">
                    <strong>📍 Vaga ${data.vaga}</strong><br>
                    🚘 <strong>${formatarPlaca(data.placa)}</strong><br>
                    🚗 ${data.modelo} • 🎨 ${data.cor}<br>
                    ⏰ ${tempo}
                </div>
            `;
        });
        
        vagasDiv.innerHTML = html;
        
    } catch (error) {
        console.error("❌ Erro ao carregar vagas:", error);
        vagasDiv.innerHTML = '<h3>📍 Vagas Ocupadas</h3><div class="erro">❌ Erro ao carregar vagas</div>';
    }
}

// CARREGAR RELATÓRIO DO DIA
async function carregarRelatorio() {
    const relatorioDiv = document.getElementById('relatorioDia');
    if (!relatorioDiv) return;

    try {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const q = query(
            collection(db, "estacionamento"),
            where("dataEntrada", ">=", hoje),
            orderBy("dataEntrada", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        
        let totalEntradas = 0;
        let totalReceita = 0;
        let veiculosEstacionados = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalEntradas++;
            
            if (data.status === 'estacionado') {
                veiculosEstacionados++;
            }
            
            if (data.valorCobrado) {
                totalReceita += data.valorCobrado;
            }
        });

        relatorioDiv.innerHTML = `
            <h3>📊 Relatório do Dia</h3>
            <div class="relatorio-item">
                <p>🚗 <strong>Entradas:</strong> ${totalEntradas}</p>
                <p>🅿️ <strong>Estacionados:</strong> ${veiculosEstacionados}</p>
                <p>💰 <strong>Receita:</strong> R$ ${totalReceita.toFixed(2)}</p>
                <p>📅 <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
        `;
        
    } catch (error) {
        console.error("❌ Erro ao carregar relatório:", error);
        relatorioDiv.innerHTML = '<h3>📊 Relatório do Dia</h3><div class="erro">❌ Erro ao carregar relatório</div>';
    }
}

// FUNÇÕES AUXILIARES

// VALIDAR PLACA (Mercosul e antigo)
function validarPlaca(placa) {
    // Remove qualquer hífen
    const placaLimpa = placa.replace(/-/g, '');
    
    // Formato Mercosul: ABC1D23
    const regexMercosul = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;
    
    // Formato Antigo: ABC1234
    const regexAntigo = /^[A-Z]{3}[0-9]{4}$/;
    
    return regexMercosul.test(placaLimpa) || regexAntigo.test(placaLimpa);
}

// FORMATAR PLACA PARA EXIBIÇÃO
function formatarPlaca(placa) {
    const placaLimpa = placa.replace(/-/g, '');
    
    if (placaLimpa.length === 7) {
        // Formato Mercosul: ABC1D23 -> ABC-1D23
        if (/^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/.test(placaLimpa)) {
            return placaLimpa.slice(0, 3) + '-' + placaLimpa.slice(3);
        }
        // Formato Antigo: ABC1234 -> ABC-1234
        else if (/^[A-Z]{3}[0-9]{4}$/.test(placaLimpa)) {
            return placaLimpa.slice(0, 3) + '-' + placaLimpa.slice(3);
        }
    }
    
    return placa;
}

// VERIFICAR SE VAGA ESTÁ OCUPADA
async function verificarVagaOcupada(vaga) {
    const q = query(
        collection(db, "estacionamento"),
        where("vaga", "==", vaga),
        where("status", "==", "estacionado")
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

// VERIFICAR SE VEÍCULO JÁ ESTÁ ESTACIONADO
async function verificarVeiculoEstacionado(placa) {
    const q = query(
        collection(db, "estacionamento"),
        where("placa", "==", placa),
        where("status", "==", "estacionado")
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

// BUSCAR VEÍCULO ESTACIONADO
async function buscarVeiculoEstacionado(placa) {
    const q = query(
        collection(db, "estacionamento"),
        where("placa", "==", placa),
        where("status", "==", "estacionado")
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }
    return null;
}

// CALCULAR TEMPO ESTACIONADO
function calcularTempoEstacionado(dataEntrada) {
    if (!dataEntrada) return "0 min";
    
    const entrada = dataEntrada.toDate ? dataEntrada.toDate() : new Date(dataEntrada);
    const agora = new Date();
    const diffMs = agora - entrada;
    
    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas === 0) {
        return `${minutos} min`;
    } else if (minutos === 0) {
        return `${horas}h`;
    }
    return `${horas}h ${minutos}min`;
}

// CALCULAR VALOR (R$ 5,00 por hora - fração cobrada como hora cheia)
function calcularValor(tempoString) {
    // Extrair horas e minutos da string
    const match = tempoString.match(/(\d+)h\s*(\d+)min/);
    
    let horasTotais = 0;
    
    if (match) {
        const horas = parseInt(match[1]);
        const minutos = parseInt(match[2]);
        horasTotais = horas + (minutos / 60);
    } else {
        // Se não conseguir parsear, assume pelo menos 1 hora
        const onlyHours = tempoString.match(/(\d+)h/);
        if (onlyHours) {
            horasTotais = parseInt(onlyHours[1]);
        } else {
            const onlyMinutes = tempoString.match(/(\d+)min/);
            if (onlyMinutes) {
                horasTotais = parseInt(onlyMinutes[1]) / 60;
            } else {
                // Valor mínimo
                return 5.00;
            }
        }
    }
    
    const valorPorHora = 5.00;
    
    // Cobrar fração de hora como hora cheia (mínimo 1 hora)
    const horasCobradas = Math.max(1, Math.ceil(horasTotais));
    
    return horasCobradas * valorPorHora;
}

// EXIBIR RECIBO
function exibirRecibo(veiculo, tempo, valor) {
    const reciboDiv = document.getElementById('recibo');
    if (!reciboDiv) return;

    reciboDiv.innerHTML = `
        <div class="recibo">
            <h3>📄 RECIBO DE ESTACIONAMENTO</h3>
            <p><strong>PLACA:</strong> ${formatarPlaca(veiculo.placa)}</p>
            <p><strong>MODELO:</strong> ${veiculo.modelo}</p>
            <p><strong>COR:</strong> ${veiculo.cor}</p>
            <p><strong>VAGA:</strong> ${veiculo.vaga}</p>
            <p><strong>TEMPO ESTACIONADO:</strong> ${tempo}</p>
            <p><strong>VALOR COBRADO:</strong> R$ ${valor.toFixed(2)}</p>
            <p><strong>DATA/HORA DE SAÍDA:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <hr>
            <p style="text-align: center; font-weight: bold;">🎉 OBRIGADO PELA PREFERÊNCIA! 🎉</p>
        </div>
    `;
    
    // Auto-remove após 15 segundos
    setTimeout(() => {
        reciboDiv.innerHTML = '';
    }, 15000);
}

// EXPORTAR FUNÇÕES PARA USO GLOBAL
window.registrarEntrada = registrarEntrada;
window.registrarSaida = registrarSaida;
window.buscarVeiculo = buscarVeiculo;

console.log("📜 Script.js carregado com sucesso!");
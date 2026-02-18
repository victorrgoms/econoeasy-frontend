export interface Pessoa {
    id: number;
    nome: string;
}

export interface Cartao {
    id: number;
    apelido: string;
    limite: number;
    diaVencimento: number;
    dono?: Pessoa;
}

export interface Compra {
    id: number;
    descricao: string;
    valor: number;
    data: string;
    mesFatura: number;
    anoFatura: number;
    parcelaAtual?: number;
    totalParcelas?: number;
    comprador?: Pessoa;
    cartao?: Cartao;
    parceiroId?: number | null;
}
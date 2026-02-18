'use client'

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Wallet, TrendingUp, CreditCard, AlertCircle } from "lucide-react"
import { useUser } from "@clerk/nextjs"

interface ResumoPessoaDTO { nome: string; total: number; }
interface ResumoCartaoDTO { apelido: string; limite: number; totalGasto: number; disponivel: number; porcentagemUso: number; }
interface DashboardProps { mes: number; ano: number; }

export default function Dashboard({ mes, ano }: DashboardProps) {
    const { user } = useUser()

    const { data: resumoPessoas, isLoading: loadingPessoas } = useQuery<ResumoPessoaDTO[]>({
        queryKey: ['resumoPessoas', mes, ano, user?.id],
        queryFn: async () => {
            if(!user?.id) return []
            return (await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/compras/resumo?mes=${mes}&ano=${ano}`, {
                headers: { "X-Usuario-Id": user.id }
            })).data
        },
        enabled: !!user?.id
    })

    const { data: resumoCartoes, isLoading: loadingCartoes } = useQuery<ResumoCartaoDTO[]>({
        queryKey: ['resumoCartoes', mes, ano, user?.id],
        queryFn: async () => {
            if(!user?.id) return []
            return (await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cartoes/resumo?mes=${mes}&ano=${ano}`, {
                headers: { "X-Usuario-Id": user.id }
            })).data
        },
        enabled: !!user?.id
    })

    if (loadingPessoas || loadingCartoes) return <div className="h-48 animate-pulse bg-gray-200 rounded-3xl mb-6"></div>

    const totalGeral = resumoPessoas?.reduce((acc, item) => acc + item.total, 0) || 0

    return (
        <div className="w-full max-w-2xl mb-8 grid gap-6">
             {/* ... O resto do HTML dos gráficos permanece IDÊNTICO, mantendo seu layout bonito ... */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg shadow-blue-200 flex flex-col justify-between h-36 relative overflow-hidden group">
                     {/* ... HTML do Card Azul ... */}
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp size={80} /></div>
                     <div><div className="flex items-center gap-2 opacity-90 mb-1"><span className="text-xs font-medium uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">Fatura {mes}/{ano}</span></div><div className="text-3xl font-bold mt-2 text-white">{totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div></div><div className="text-white text-xs mt-auto opacity-90 font-medium">Total acumulado</div>
                </div>
                
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center h-36">
                    <h3 className="text-gray-400 text-[10px] uppercase font-bold mb-3 flex items-center gap-2 tracking-wider"><Wallet size={14} /> Divisão da Conta</h3>
                    <div className="space-y-2">
                        {resumoPessoas?.map((item) => (
                            <div key={item.nome} className="flex justify-between items-center text-sm border-b border-dashed border-gray-100 last:border-0 pb-1 last:pb-0">
                                <span className="text-gray-600 font-medium">{item.nome}</span>
                                <span className="font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded text-xs">{item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        ))}
                    </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-gray-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-2"><CreditCard size={14} /> Faturas e Limites</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {resumoCartoes?.map(c => {
                         let corBarra = "bg-emerald-500"; let corTexto = "text-emerald-600"; let bgIcone = "bg-emerald-100";
                         if (c.porcentagemUso > 50) { corBarra = "bg-amber-500"; corTexto = "text-amber-600"; bgIcone = "bg-amber-100"; }
                         if (c.porcentagemUso > 90) { corBarra = "bg-rose-500"; corTexto = "text-rose-600"; bgIcone = "bg-rose-100"; }
                         return (
                            <div key={c.apelido} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${bgIcone}`}><CreditCard size={18} className={corTexto} /></div>
                                        <div><h4 className="font-bold text-gray-800 text-sm">{c.apelido}</h4><p className="text-[10px] text-gray-400">Limite: {c.limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                                    </div>
                                    <div className="text-right"><span className="block text-lg font-bold text-gray-800">{c.totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-semibold"><span className={corTexto}>{c.porcentagemUso.toFixed(1)}% usado</span><span>Disp: {c.disponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full ${corBarra}`} style={{ width: `${Math.min(c.porcentagemUso, 100)}%` }}></div></div>
                                </div>
                            </div>
                         )
                    })}
                </div>
             </div>
        </div>
    )
}
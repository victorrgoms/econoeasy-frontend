'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { Compra } from "../types" 
import { PlusCircle, Trash2, CreditCard, User, Calendar, Edit, Settings, AlertCircle } from "lucide-react"
import { useModalStore } from "../store/useModalStore"
import CreateCompraForm from "../components/CreateCompraForm"
import Dashboard from "../components/Dashboard"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"

export default function Home() {
  const { abrirModal, abrirParaEditar } = useModalStore() 
  const queryClient = useQueryClient()
  const { user, isLoaded } = useUser()

  const hoje = new Date()
  const [mesFiltro, setMesFiltro] = useState(hoje.getMonth() + 1)
  const [anoFiltro, setAnoFiltro] = useState(hoje.getFullYear())

  const { data: compras, isLoading, error } = useQuery<Compra[]>({
    queryKey: ['compras', mesFiltro, anoFiltro, user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/compras?mes=${mesFiltro}&ano=${anoFiltro}`, {
        headers: { "X-Usuario-Id": user.id }
      })
      return response.data
    },
    enabled: !!user?.id
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
        return axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/compras/${id}`, {
            headers: { "X-Usuario-Id": user?.id }
        })
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['compras'] })
        queryClient.invalidateQueries({ queryKey: ['resumoPessoas'] })
        queryClient.invalidateQueries({ queryKey: ['resumoCartoes'] })
    },
    onError: () => alert("Erro ao deletar.")
  })

  // mutacao pra varrer tudo
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
        return axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/compras/todas`, {
            headers: { "X-Usuario-Id": user?.id }
        })
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['compras'] })
        queryClient.invalidateQueries({ queryKey: ['resumoPessoas'] })
        queryClient.invalidateQueries({ queryKey: ['resumoCartoes'] })
    },
    onError: () => alert("Erro ao deletar tudo.")
  })

  const handleDelete = (id: number) => {
    if (confirm("Apagar despesa?")) deleteMutation.mutate(id)
  }

  // trigger do alerta de confirmacao
  const handleDeleteAll = () => {
    if (confirm("Tem certeza? Isso apagará TODAS as suas despesas e não pode ser desfeito.")) {
        deleteAllMutation.mutate()
    }
  }

  const mudarMes = (direcao: number) => {
    let novoMes = mesFiltro + direcao
    let novoAno = anoFiltro
    if (novoMes > 12) { novoMes = 1; novoAno++ }
    if (novoMes < 1) { novoMes = 12; novoAno-- }
    setMesFiltro(novoMes)
    setAnoFiltro(novoAno)
  }

  if (!isLoaded || isLoading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center animate-pulse gap-4">
            <div className="h-12 w-12 bg-blue-200 rounded-full"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
    </div>
  )
  
  if (error) return <div className="text-center p-10 text-red-500">Erro de conexão com o servidor!</div>

  const nomeMes = new Date(anoFiltro, mesFiltro - 1).toLocaleString('pt-BR', { month: 'long' })

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50">
      
      <div className="w-full max-w-2xl flex flex-col gap-8 mb-8">
        
        <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <div className="relative flex items-center">
                <Image 
                    src="/Econoeasy.png" 
                    alt="Econoeasy" 
                    width={150} 
                    height={45} 
                    className="w-32 md:w-40 h-auto object-contain"
                    priority
                />
            </div>
            
            <div className="flex items-center gap-2">
                {/* botao vermelho pra resetar as compras */}
                <button 
                    onClick={handleDeleteAll} 
                    className="p-3 text-red-400 hover:text-white hover:bg-red-500 transition bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center"
                    title="Apagar Tudo"
                >
                    <Trash2 size={22} />
                </button>

                <button 
                    onClick={abrirModal} 
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95 font-bold tracking-wide"
                >
                    <PlusCircle size={20} /> 
                    <span className="hidden sm:inline">Nova Despesa</span>
                    <span className="sm:hidden">Nova</span>
                </button>

                <Link 
                    href="/cadastros" 
                    className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md flex items-center justify-center active:scale-95"
                    title="Configurações"
                >
                    <Settings size={22} />
                </Link>
            </div>
        </div>

        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <button onClick={() => mudarMes(-1)} className="p-3 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-blue-600 transition hover:scale-110">
                ◀
            </button>
            
            <div className="flex flex-col items-center">
                <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">{anoFiltro}</span>
                <span className="text-xl md:text-2xl font-bold text-gray-800 capitalize flex items-center gap-2">
                    <Calendar size={22} className="text-blue-500 mb-1"/> {nomeMes}
                </span>
            </div>

            <button onClick={() => mudarMes(1)} className="p-3 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-blue-600 transition hover:scale-110">
                ▶
            </button>
        </div>
      </div>

      <Dashboard mes={mesFiltro} ano={anoFiltro} />

      <div className="w-full max-w-2xl mt-8 space-y-4 pb-20">
        
        {(compras?.length ?? 0) > 0 && (
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 mb-3">Histórico de Gastos</h3>
        )}

        {compras?.map((compra) => (
          <div key={compra.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
            
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    {compra.descricao}
                    {compra.totalParcelas && compra.totalParcelas > 1 && (
                        <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold border border-orange-100">
                            {compra.parcelaAtual}/{compra.totalParcelas}
                        </span>
                    )}
                </h2>
                
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg text-xs border border-gray-100 font-medium text-gray-600">
                    <User size={12} className="text-blue-500"/> {compra.comprador?.nome || '—'}
                  </span>
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg text-xs border border-gray-100 font-medium text-gray-600">
                    <CreditCard size={12} className="text-purple-500"/> {compra.cartao?.apelido || '—'}
                  </span>
                  <span className="text-xs text-gray-300 mx-1 hidden sm:inline">•</span>
                  <span className="text-xs text-gray-400">{new Date(compra.data).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="text-xl font-bold text-gray-800 tracking-tight">
                  {compra.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                
                <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                        onClick={() => abrirParaEditar(compra)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                    >
                        <Edit size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(compra.id)} 
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
              </div>
            </div>

            {compra.parceiroId && (
              <div className="mt-4 pt-3 border-t border-dashed border-gray-100 text-xs text-purple-600 font-medium flex items-center gap-2">
                <span className="bg-purple-100 p-1 rounded-full">🤝</span> Dividido com parceiro
              </div>
            )}
          </div>
        ))}

        {compras?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 mx-auto">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <AlertCircle size={32} className="opacity-40 text-gray-500"/>
                </div>
                <p className="font-medium text-gray-500">Nenhuma despesa em {nomeMes}.</p>
                <p className="text-sm mt-2 text-blue-600 cursor-pointer hover:underline font-semibold" onClick={abrirModal}>
                    Adicionar despesa
                </p>
            </div>
        )}
      </div>

      <CreateCompraForm />
    </main>
  )
}
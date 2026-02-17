'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useState } from "react"
import { Trash2, ArrowLeft, Edit, Plus, Save, X, User, CreditCard } from "lucide-react"
import Link from "next/link"

interface Pessoa { id: number; nome: string }
interface Cartao { id: number; apelido: string; limite: number; diaVencimento: number; dono: Pessoa }

export default function CadastrosPage() {
    const queryClient = useQueryClient()

    //  ESTADOS 
    const [editandoPessoaId, setEditandoPessoaId] = useState<number | null>(null)
    const [editandoCartaoId, setEditandoCartaoId] = useState<number | null>(null)
    const [nomePessoa, setNomePessoa] = useState('')
    const [formCartao, setFormCartao] = useState({ apelido: '', limite: '', dia: '', donoId: '' })

    // ================== PESSOAS ==================
    const { data: pessoas } = useQuery<Pessoa[]>({ 
        queryKey: ['pessoas'], 
        queryFn: async () => (await axios.get('http://localhost:8080/pessoas')).data 
    })

    const salvarPessoa = useMutation({
        mutationFn: async () => {
            if (editandoPessoaId) return axios.put(`http://localhost:8080/pessoas/${editandoPessoaId}`, { nome: nomePessoa })
            else return axios.post('http://localhost:8080/pessoas', { nome: nomePessoa })
        },
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['pessoas'] })
            cancelarEdicaoPessoa() 
        }
    })

    const deletarPessoa = useMutation({
        mutationFn: async (id: number) => axios.delete(`http://localhost:8080/pessoas/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pessoas'] }),
        onError: () => alert("Erro: Esta pessoa possui vínculos e não pode ser apagada.")
    })

    const preencherEdicaoPessoa = (p: Pessoa) => { setEditandoPessoaId(p.id); setNomePessoa(p.nome) }
    const cancelarEdicaoPessoa = () => { setEditandoPessoaId(null); setNomePessoa('') }

    // ================== CARTÕES ==================
    const { data: cartoes } = useQuery<Cartao[]>({ 
        queryKey: ['cartoes'], 
        queryFn: async () => (await axios.get('http://localhost:8080/cartoes')).data 
    })

    const salvarCartaoMutation = useMutation({
        mutationFn: async () => {
            const payload = { 
                apelido: formCartao.apelido, 
                limite: Number(formCartao.limite), 
                diaVencimento: Number(formCartao.dia), 
                donoId: Number(formCartao.donoId) 
            }
            if (editandoCartaoId) return axios.put(`http://localhost:8080/cartoes/${editandoCartaoId}`, payload)
            else return axios.post('http://localhost:8080/cartoes', payload)
        },
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['cartoes'] })
            cancelarEdicaoCartao() 
        },
        onError: () => alert("Erro ao salvar o cartão. Verifique se o dono foi selecionado corretamente.")
    })

    const handleSalvarCartao = () => {
        if (!formCartao.apelido || !formCartao.donoId) {
            alert("Preencha o apelido e selecione um dono!");
            return;
        }
        salvarCartaoMutation.mutate()
    }

    const deletarCartao = useMutation({
        mutationFn: async (id: number) => axios.delete(`http://localhost:8080/cartoes/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cartoes'] }),
        onError: () => alert("Erro ao apagar cartão.")
    })

    const preencherEdicaoCartao = (c: Cartao) => {
        setEditandoCartaoId(c.id)
        setFormCartao({ 
            apelido: c.apelido, 
            limite: c.limite.toString(), 
            dia: c.diaVencimento.toString(), 
            donoId: c.dono?.id ? c.dono.id.toString() : '' 
        })
    }
    const cancelarEdicaoCartao = () => { setEditandoCartaoId(null); setFormCartao({ apelido: '', limite: '', dia: '', donoId: '' }) }

    return (
        <main className="min-h-screen p-4 md:p-8 bg-gray-50 flex flex-col items-center">
            
            <div className="w-full max-w-2xl flex flex-col gap-10">
                
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-3 bg-white rounded-full hover:bg-gray-100 text-gray-600 transition shadow-sm border border-gray-100">
                        <ArrowLeft size={22} />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Gerenciar Cadastros</h1>
                </div>

                {/*  SEÇÃO PESSOAS  */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6 text-blue-600 border-b border-gray-100 pb-4">
                        <User size={24} />
                        <h2 className="text-xl font-bold">Pessoas</h2>
                    </div>
                    <div className="flex gap-3 mb-6">
                        <input 
                            value={nomePessoa} onChange={e => setNomePessoa(e.target.value)}
                            placeholder="Nome..." className="border p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-100 text-base"
                        />
                        {editandoPessoaId ? (
                            <div className="flex gap-2">
                                <button onClick={() => salvarPessoa.mutate()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition"><Save size={24}/></button>
                                <button onClick={cancelarEdicaoPessoa} className="bg-gray-100 text-gray-500 p-3 rounded-xl hover:bg-gray-200 transition"><X size={24}/></button>
                            </div>
                        ) : (
                            <button onClick={() => salvarPessoa.mutate()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"><Plus size={24}/></button>
                        )}
                    </div>
                    <div className="space-y-3">
                        {pessoas?.map(p => (
                            <div key={p.id} className={`flex justify-between items-center p-4 rounded-xl border transition ${editandoPessoaId === p.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                                <span className="text-lg font-medium text-gray-700">{p.nome}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => preencherEdicaoPessoa(p)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"><Edit size={20}/></button>
                                    <button onClick={() => { if(confirm('Apagar pessoa?')) deletarPessoa.mutate(p.id) }} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 size={20}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/*  SEÇÃO CARTÕES  */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6 text-purple-600 border-b border-gray-100 pb-4">
                        <CreditCard size={24} />
                        <h2 className="text-xl font-bold">Cartões</h2>
                    </div>
                    
                    <div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-100">
                        <div className="space-y-4">
                            <input 
                                value={formCartao.apelido} onChange={e => setFormCartao({...formCartao, apelido: e.target.value})} 
                                placeholder="Apelido (ex: Nubank)" className="border p-3 rounded-xl w-full text-base outline-none focus:border-purple-400" 
                            />
                            <div className="flex gap-3">
                                <input type="number" value={formCartao.limite} onChange={e => setFormCartao({...formCartao, limite: e.target.value})} placeholder="Limite R$" className="border p-3 rounded-xl w-full text-base outline-none focus:border-purple-400" />
                                <input type="number" value={formCartao.dia} onChange={e => setFormCartao({...formCartao, dia: e.target.value})} placeholder="Dia Venc." className="border p-3 rounded-xl w-1/3 text-base outline-none focus:border-purple-400" />
                            </div>
                            <select 
                                value={formCartao.donoId} 
                                onChange={e => setFormCartao({...formCartao, donoId: e.target.value})} 
                                className="border p-3 rounded-xl w-full text-base bg-white outline-none focus:border-purple-400"
                            >
                                <option value="">Selecione o Dono...</option>
                                {pessoas?.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                            <div className="pt-2">
                                {editandoCartaoId ? (
                                    <div className="flex gap-3">
                                        <button onClick={handleSalvarCartao} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition flex-1 flex justify-center shadow-lg shadow-blue-200"><Save size={24}/></button>
                                        <button onClick={cancelarEdicaoCartao} className="bg-gray-100 text-gray-500 p-3 rounded-xl hover:bg-gray-200 transition"><X size={24}/></button>
                                    </div>
                                ) : (
                                    <button onClick={handleSalvarCartao} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                                        <Plus size={22} /> Adicionar Cartão
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {cartoes?.map(c => (
                            <div key={c.id} className={`flex justify-between items-center p-4 rounded-xl border transition group ${editandoCartaoId === c.id ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-100'}`}>
                                <div>
                                    <p className="font-bold text-gray-700 text-base flex items-center gap-2">
                                        {c.apelido}
                                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border">Dia {c.diaVencimento}</span>
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">Dono: {c.dono?.nome || 'Sem dono'} • Limite: R$ {c.limite}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => preencherEdicaoCartao(c)} className="p-2 text-gray-400 hover:text-purple-600 rounded-lg"><Edit size={20}/></button>
                                    <button onClick={() => { if(confirm('Apagar cartão?')) deletarCartao.mutate(c.id) }} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={20}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    )
}
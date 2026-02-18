'use client'
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useState } from "react"
import { Trash2, ArrowLeft, Edit, Plus, Save, X, User, CreditCard } from "lucide-react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"

interface Pessoa { id: number; nome: string }
interface Cartao { id: number; apelido: string; limite: number; diaVencimento: number; dono: Pessoa }

export default function CadastrosPage() {
    const queryClient = useQueryClient()
    const { user } = useUser()

    // Estados
    const [editandoPessoaId, setEditandoPessoaId] = useState<number | null>(null); const [editandoCartaoId, setEditandoCartaoId] = useState<number | null>(null); const [nomePessoa, setNomePessoa] = useState(''); const [formCartao, setFormCartao] = useState({ apelido: '', limite: '', dia: '', donoId: '' })

    const config = { headers: { "X-Usuario-Id": user?.id } } // Configuração reutilizável

    // Pessoas
    const { data: pessoas } = useQuery<Pessoa[]>({ queryKey: ['pessoas', user?.id], queryFn: async () => { if(!user?.id) return []; return (await axios.get('${process.env.NEXT_PUBLIC_API_URL}/pessoas', config)).data }, enabled: !!user })
    const salvarPessoa = useMutation({ mutationFn: async () => { if (editandoPessoaId) return axios.put(`${process.env.NEXT_PUBLIC_API_URL}/pessoas/${editandoPessoaId}`, { nome: nomePessoa }, config); else return axios.post('${process.env.NEXT_PUBLIC_API_URL}/pessoas', { nome: nomePessoa }, config) }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pessoas'] }); setEditandoPessoaId(null); setNomePessoa('') } })
    const deletarPessoa = useMutation({ mutationFn: async (id: number) => axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/pessoas/${id}`, config), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pessoas'] }), onError: () => alert("Erro ao apagar.") })

    // Cartões
    const { data: cartoes } = useQuery<Cartao[]>({ queryKey: ['cartoes', user?.id], queryFn: async () => { if(!user?.id) return []; return (await axios.get('${process.env.NEXT_PUBLIC_API_URL}/cartoes', config)).data }, enabled: !!user })
    const salvarCartaoMutation = useMutation({ mutationFn: async () => { const payload = { apelido: formCartao.apelido, limite: Number(formCartao.limite), diaVencimento: Number(formCartao.dia), donoId: Number(formCartao.donoId) }; if (editandoCartaoId) return axios.put(`${process.env.NEXT_PUBLIC_API_URL}/cartoes/${editandoCartaoId}`, payload, config); else return axios.post('${process.env.NEXT_PUBLIC_API_URL}/cartoes', payload, config) }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cartoes'] }); setEditandoCartaoId(null); setFormCartao({ apelido: '', limite: '', dia: '', donoId: '' }) } })
    const deletarCartao = useMutation({ mutationFn: async (id: number) => axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/cartoes/${id}`, config), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cartoes'] }), onError: () => alert("Erro ao apagar.") })

    // Helpers de UI
    const preencherEdicaoPessoa = (p: Pessoa) => { setEditandoPessoaId(p.id); setNomePessoa(p.nome) }
    const preencherEdicaoCartao = (c: Cartao) => { setEditandoCartaoId(c.id); setFormCartao({ apelido: c.apelido, limite: c.limite.toString(), dia: c.diaVencimento.toString(), donoId: c.dono?.id ? c.dono.id.toString() : '' }) }

    return (
        <main className="min-h-screen p-4 md:p-8 bg-gray-50 flex flex-col items-center">
            <div className="w-full max-w-2xl flex flex-col gap-8">
                <div className="flex items-center gap-4"><Link href="/" className="p-3 bg-white rounded-full hover:bg-gray-100 shadow-sm border"><ArrowLeft size={22} /></Link><h1 className="text-3xl font-bold text-gray-800">Gerenciar Cadastros</h1></div>
                
                {/* Seção Pessoas */}
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6 text-blue-600 border-b border-gray-100 pb-4"><User size={24} /><h2 className="text-xl font-bold">Pessoas</h2></div>
                    <div className="flex gap-3 mb-6"><input value={nomePessoa} onChange={e => setNomePessoa(e.target.value)} placeholder="Nome..." className="border p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-100" /><button onClick={() => salvarPessoa.mutate()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">{editandoPessoaId ? <Save size={24}/> : <Plus size={24}/>}</button></div>
                    <div className="space-y-3">{pessoas?.map(p => (<div key={p.id} className="flex justify-between items-center p-4 rounded-xl border bg-gray-50"><span className="text-lg font-medium text-gray-700">{p.nome}</span><div className="flex gap-2"><button onClick={() => preencherEdicaoPessoa(p)} className="p-2 text-gray-400 hover:text-blue-600"><Edit size={20}/></button><button onClick={() => { if(confirm('Apagar?')) deletarPessoa.mutate(p.id) }} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={20}/></button></div></div>))}</div>
                </section>

                {/* Seção Cartões */}
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6 text-purple-600 border-b border-gray-100 pb-4"><CreditCard size={24} /><h2 className="text-xl font-bold">Cartões</h2></div>
                    <div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-100 space-y-4">
                        <input value={formCartao.apelido} onChange={e => setFormCartao({...formCartao, apelido: e.target.value})} placeholder="Apelido (ex: Nubank)" className="border p-3 rounded-xl w-full" />
                        <div className="flex gap-3"><input type="number" value={formCartao.limite} onChange={e => setFormCartao({...formCartao, limite: e.target.value})} placeholder="Limite R$" className="border p-3 rounded-xl w-full" /><input type="number" value={formCartao.dia} onChange={e => setFormCartao({...formCartao, dia: e.target.value})} placeholder="Dia Venc." className="border p-3 rounded-xl w-1/3" /></div>
                        <select value={formCartao.donoId} onChange={e => setFormCartao({...formCartao, donoId: e.target.value})} className="border p-3 rounded-xl w-full bg-white"><option value="">Selecione o Dono...</option>{pessoas?.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
                        <button onClick={() => { if(!formCartao.apelido || !formCartao.donoId) return alert('Preencha tudo!'); salvarCartaoMutation.mutate() }} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex justify-center">{editandoCartaoId ? <Save size={22}/> : <><Plus size={22}/> Adicionar Cartão</>}</button>
                    </div>
                    <div className="space-y-3">{cartoes?.map(c => (<div key={c.id} className="flex justify-between items-center p-4 rounded-xl border bg-white"><div className="text-gray-700"><p className="font-bold">{c.apelido}</p><p className="text-sm text-gray-400">Dono: {c.dono?.nome}</p></div><div className="flex gap-2"><button onClick={() => preencherEdicaoCartao(c)} className="p-2 text-gray-400 hover:text-purple-600"><Edit size={20}/></button><button onClick={() => { if(confirm('Apagar?')) deletarCartao.mutate(c.id) }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={20}/></button></div></div>))}</div>
                </section>
            </div>
        </main>
    )
}
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Drawer,
} from '@mui/material'
import { DollarSign, Plus, RefreshCw, Building2, Pencil, X, Trash2 } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import {
  CostTreeFlow,
  type CanvasDialogAction,
  type CanvasDialogContext,
  type PendingNodePlacement,
} from '@/components/cost-management/CostTreeFlow'
import { useCostGraph } from '@/hooks/use-cost-graph'
import { useAuth } from '@/contexts/AuthContext'
import { useOrgEntries, type OrgEntry } from '@/hooks/use-org'
import type { CostCanvasFocus, PunctualCostRow } from '@/types/cost-org'
import { CostCanvasDrawerPanel } from '@/components/cost-management/CostCanvasDrawerPanel'

const API_URL = import.meta.env.VITE_API_URL || ''
const MAIN_HEADER_PX = 59
const DRAWER_WIDTH = { xs: '100%', sm: 420 } as const

type CostDeletePreviewRow = { key: string; title: string; subtitle?: string }

function brlFieldToNumber(raw: string): number {
  const normalized = raw.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  if (!normalized) return 0
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function numberToBrlField(value: number | string | null | undefined): string {
  if (value == null || value === '') return ''
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return ''
  return String(parsed).replace('.', ',')
}

/** Meses de calendário inclusivos (para rateio de custo por período). */
function inclusiveMonthCount(isoStart: string, isoEnd: string): number {
  const a = isoStart.slice(0, 10).split('-').map(Number)
  const b = isoEnd.slice(0, 10).split('-').map(Number)
  if (a.length < 3 || b.length < 3) return 0
  const [ys, ms, ds] = a
  const [ye, me, de] = b
  const s = new Date(ys, ms - 1, ds)
  const e = new Date(ye, me - 1, de)
  if (e < s) return 0
  return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1
}

function splitTotalAcrossMonths(total: number, months: number): number[] {
  if (months <= 0 || !Number.isFinite(total)) return []
  const cents = Math.round(total * 100)
  const baseCents = Math.floor(cents / months)
  const arr = Array.from({ length: months }, () => baseCents / 100)
  const last = cents - baseCents * months
  arr[months - 1] = Math.round((arr[months - 1] * 100 + last)) / 100
  return arr
}

export default function CustosDepartamento() {
  const { getAuthHeaders } = useAuth()
  const { graph, loading, error, fetchGraph } = useCostGraph()
  const { entries: orgEntries, fetchEntries, updateEntry } = useOrgEntries()

  const [canvasFocus, setCanvasFocus] = useState<CostCanvasFocus | null>(null)

  const [drawerDeptEditOpen, setDrawerDeptEditOpen] = useState(false)
  const [drawerDeptName, setDrawerDeptName] = useState('')
  const [drawerDeptDesc, setDrawerDeptDesc] = useState('')
  const [drawerDeptErr, setDrawerDeptErr] = useState<string | null>(null)
  const [drawerDeptSaving, setDrawerDeptSaving] = useState(false)

  const [drawerMemberEditOpen, setDrawerMemberEditOpen] = useState(false)
  const [drawerMemberCost, setDrawerMemberCost] = useState('0')
  const [drawerMemberErr, setDrawerMemberErr] = useState<string | null>(null)
  const [drawerMemberSaving, setDrawerMemberSaving] = useState(false)

  const [deptDialog, setDeptDialog] = useState(false)
  const [deptName, setDeptName] = useState('')
  const [deptDesc, setDeptDesc] = useState('')

  const [newCostDialogOpen, setNewCostDialogOpen] = useState(false)
  const [ncIsFixed, setNcIsFixed] = useState(true)
  const [ncVarKind, setNcVarKind] = useState<'punctual' | 'period'>('punctual')
  const [costName, setCostName] = useState('')
  const [costAmount, setCostAmount] = useState('0')
  const [costCategory, setCostCategory] = useState('ferramenta')
  const [costDeptId, setCostDeptId] = useState('')
  const [ncPeriodStart, setNcPeriodStart] = useState('')
  const [ncPeriodEnd, setNcPeriodEnd] = useState('')
  const [ncVarTitle, setNcVarTitle] = useState('')
  const [ncVarDesc, setNcVarDesc] = useState('')
  const [ncVarAmount, setNcVarAmount] = useState('0')
  const [ncVarCurrency, setNcVarCurrency] = useState('BRL')
  const [ncVarDate, setNcVarDate] = useState('')

  const [linkDialog, setLinkDialog] = useState(false)
  const [linkDeptId, setLinkDeptId] = useState('')
  const [linkCostId, setLinkCostId] = useState('')

  const [punctualDialog, setPunctualDialog] = useState(false)
  const [punctualEditId, setPunctualEditId] = useState<string | null>(null)
  const [punctualDeptId, setPunctualDeptId] = useState('')
  const [punctualTitle, setPunctualTitle] = useState('')
  const [punctualDesc, setPunctualDesc] = useState('')
  const [punctualAmount, setPunctualAmount] = useState('0')
  const [punctualCurrency, setPunctualCurrency] = useState('BRL')
  const [punctualDate, setPunctualDate] = useState('')
  const [punctualTimingKind, setPunctualTimingKind] = useState<'punctual' | 'period'>('punctual')
  const [punctualPeriodStart, setPunctualPeriodStart] = useState('')
  const [punctualPeriodEnd, setPunctualPeriodEnd] = useState('')

  const [manageDialogOpen, setManageDialogOpen] = useState(false)
  /** Obrigatório ao criar departamento: responsável no organograma (time derivado da hierarquia). */
  const [deptOrgEntryId, setDeptOrgEntryId] = useState('')

  const [formErr, setFormErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [editCostOpen, setEditCostOpen] = useState(false)
  const [editCostId, setEditCostId] = useState<string | null>(null)
  const [editCostErr, setEditCostErr] = useState<string | null>(null)
  const [ecName, setEcName] = useState('')
  const [ecDescription, setEcDescription] = useState('')
  const [ecAmount, setEcAmount] = useState('0')
  const [ecCurrency, setEcCurrency] = useState('BRL')
  const [ecStatus, setEcStatus] = useState('analise')
  const [ecCategory, setEcCategory] = useState('outro')
  const [ecIsActive, setEcIsActive] = useState(true)
  const [ecActivities, setEcActivities] = useState('')
  const [ecResultDesc, setEcResultDesc] = useState('')
  const [ecResultAmount, setEcResultAmount] = useState('')

  /** Posição no fluxo para spawn após POST (botão direito no canvas) */
  const canvasSpawnRef = useRef<{ x: number; y: number } | null>(null)
  const [pendingNodePlacement, setPendingNodePlacement] = useState<PendingNodePlacement | null>(null)

  const [costDeletePreviewOpen, setCostDeletePreviewOpen] = useState(false)
  const [costDeleteConfirmOpen, setCostDeleteConfirmOpen] = useState(false)
  const [costDeleteBusy, setCostDeleteBusy] = useState(false)
  const [costDeleteError, setCostDeleteError] = useState<string | null>(null)

  useEffect(() => {
    void fetchGraph()
    void fetchEntries()
  }, [fetchGraph, fetchEntries])

  const entryLabel = (e: { person_name: string; job_title: string | null }) =>
    e.job_title?.trim() ? `${e.person_name} — ${e.job_title}` : e.person_name

  const responsiblesForDept = (deptId: string) =>
    orgEntries.filter((e: OrgEntry) => e.department_id === deptId)

  const openManageDialog = () => {
    setFormErr(null)
    setManageDialogOpen(true)
    void fetchEntries()
  }

  const postJson = useCallback(
    async (path: string, body: unknown) => {
      const url = API_URL ? `${API_URL}${path}` : path
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || res.statusText)
      }
      return res.json()
    },
    [getAuthHeaders]
  )

  const patchJson = useCallback(
    async (path: string, body: unknown) => {
      const url = API_URL ? `${API_URL}${path}` : path
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || res.statusText)
      }
      return res.json()
    },
    [getAuthHeaders]
  )

  const deleteJson = useCallback(
    async (path: string) => {
      const url = API_URL ? `${API_URL}${path}` : path
      const res = await fetch(url, { method: 'DELETE', headers: getAuthHeaders() })
      if (!res.ok && res.status !== 204) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || res.statusText)
      }
    },
    [getAuthHeaders]
  )

  const closeCostDrawer = useCallback(() => {
    setCanvasFocus(null)
    setDrawerDeptEditOpen(false)
    setDrawerMemberEditOpen(false)
    setDrawerDeptErr(null)
    setDrawerMemberErr(null)
    setCostDeletePreviewOpen(false)
    setCostDeleteConfirmOpen(false)
    setCostDeleteError(null)
    setPunctualDialog(false)
  }, [])

  const costDeletePreviewRows = useMemo((): CostDeletePreviewRow[] => {
    if (!graph || !canvasFocus) return []
    if (canvasFocus.kind === 'department') {
      const d = graph.departments.find((x) => x.id === canvasFocus.departmentId)
      const name = d?.name ?? 'Departamento'
      const rows: CostDeletePreviewRow[] = [
        { key: 'dept', title: name, subtitle: 'Exclusão do departamento (centro de custo)' },
      ]
      const mems = graph.members.filter((m) => m.department_id === canvasFocus.departmentId)
      for (const m of mems) {
        rows.push({
          key: `mem-${m.user_id}`,
          title: m.user?.name ?? m.user_id,
          subtitle: 'Remoção da pessoa neste departamento',
        })
      }
      const links = graph.departmentCosts.filter((l) => l.department_id === canvasFocus.departmentId)
      for (const l of links) {
        const c = graph.costItems.find((ci) => ci.id === l.cost_id)
        rows.push({
          key: `link-${l.cost_id}`,
          title: c?.name ?? 'Custo fixo',
          subtitle: 'Desvinculação — o cadastro do custo permanece no sistema',
        })
      }
      const punctuals = (graph.punctualCosts ?? []).filter((p) => p.department_id === canvasFocus.departmentId)
      for (const p of punctuals) {
        const sub =
          p.timing_kind === 'period' && p.period_start_date && p.period_end_date
            ? `Custo por período (${p.period_start_date} → ${p.period_end_date}) — removido com o departamento`
            : `Custo pontual (${new Date(p.reference_date + 'T12:00:00').toLocaleDateString('pt-BR')}) — removido com o departamento`
        rows.push({
          key: `punctual-${p.id}`,
          title: p.title,
          subtitle: sub,
        })
      }
      return rows
    }
    if (canvasFocus.kind === 'cost') {
      const c = graph.costItems.find((x) => x.id === canvasFocus.costId)
      const depts = graph.departmentCosts
        .filter((l) => l.cost_id === canvasFocus.costId)
        .map((l) => graph.departments.find((dep) => dep.id === l.department_id))
        .filter((dep): dep is NonNullable<typeof dep> => Boolean(dep))
      const rows: CostDeletePreviewRow[] = [
        {
          key: 'cost',
          title: c?.name ?? 'Custo fixo',
          subtitle: 'Exclusão definitiva do item e de todos os vínculos',
        },
      ]
      for (const dep of depts) {
        rows.push({
          key: `dept-${dep.id}`,
          title: dep.name,
          subtitle: 'Vínculo com este departamento será removido',
        })
      }
      return rows
    }
    const m = graph.members.find(
      (x) => x.department_id === canvasFocus.departmentId && x.user_id === canvasFocus.userId
    )
    const dn = graph.departments.find((dep) => dep.id === canvasFocus.departmentId)?.name ?? 'Departamento'
    return [
      {
        key: 'mem',
        title: m?.user?.name ?? m?.user_id ?? 'Pessoa',
        subtitle: `Remoção do vínculo com ${dn}`,
      },
    ]
  }, [graph, canvasFocus])

  const costDeleteButtonLabel =
    canvasFocus?.kind === 'department'
      ? 'Excluir item/subárvore'
      : canvasFocus?.kind === 'cost'
        ? 'Excluir custo fixo'
        : 'Remover pessoa do departamento'

  const openCostDeletePreview = () => {
    setCostDeleteError(null)
    setCostDeletePreviewOpen(true)
  }

  const closeCostDeleteFlow = () => {
    setCostDeletePreviewOpen(false)
    setCostDeleteConfirmOpen(false)
    setCostDeleteError(null)
  }

  const goToCostDeleteFinalConfirm = () => {
    setCostDeletePreviewOpen(false)
    setCostDeleteConfirmOpen(true)
  }

  const confirmCostDelete = async () => {
    if (!canvasFocus) return
    setCostDeleteBusy(true)
    setCostDeleteError(null)
    try {
      if (canvasFocus.kind === 'department') {
        await deleteJson(`/api/departments/${canvasFocus.departmentId}`)
      } else if (canvasFocus.kind === 'cost') {
        await deleteJson(`/api/cost-items/${canvasFocus.costId}`)
      } else {
        await deleteJson(`/api/departments/${canvasFocus.departmentId}/members/${canvasFocus.userId}`)
      }
      closeCostDeleteFlow()
      closeCostDrawer()
      await fetchGraph()
    } catch (e) {
      setCostDeleteError((e as Error).message)
    } finally {
      setCostDeleteBusy(false)
    }
  }

  useEffect(() => {
    if (canvasFocus?.kind === 'department') {
      const d = graph?.departments.find((x) => x.id === canvasFocus.departmentId)
      if (d) {
        setDrawerDeptName(d.name)
        setDrawerDeptDesc(d.description ?? '')
      }
      setDrawerDeptEditOpen(false)
      setDrawerDeptErr(null)
    }
  }, [canvasFocus, graph?.departments])

  useEffect(() => {
    if (canvasFocus?.kind === 'member') {
      const m = graph?.members.find(
        (x) => x.department_id === canvasFocus.departmentId && x.user_id === canvasFocus.userId
      )
      if (m) setDrawerMemberCost(numberToBrlField(Number(m.individual_monthly_cost) || 0))
      setDrawerMemberEditOpen(false)
      setDrawerMemberErr(null)
    }
  }, [canvasFocus, graph?.members])

  const saveDrawerDepartment = useCallback(async () => {
    if (canvasFocus?.kind !== 'department') return
    const name = drawerDeptName.trim()
    if (!name) {
      setDrawerDeptErr('Informe o nome')
      return
    }
    setDrawerDeptSaving(true)
    setDrawerDeptErr(null)
    try {
      await patchJson(`/api/departments/${canvasFocus.departmentId}`, {
        name,
        description: drawerDeptDesc.trim() || null,
      })
      setDrawerDeptEditOpen(false)
      await fetchGraph()
    } catch (e) {
      setDrawerDeptErr((e as Error).message)
    } finally {
      setDrawerDeptSaving(false)
    }
  }, [canvasFocus, drawerDeptName, drawerDeptDesc, patchJson, fetchGraph])

  const saveDrawerMember = useCallback(async () => {
    if (canvasFocus?.kind !== 'member') return
    setDrawerMemberSaving(true)
    setDrawerMemberErr(null)
    try {
      await patchJson(`/api/departments/${canvasFocus.departmentId}/members/${canvasFocus.userId}`, {
        individual_monthly_cost: brlFieldToNumber(drawerMemberCost),
      })
      setDrawerMemberEditOpen(false)
      await fetchGraph()
    } catch (e) {
      setDrawerMemberErr((e as Error).message)
    } finally {
      setDrawerMemberSaving(false)
    }
  }, [canvasFocus, drawerMemberCost, patchJson, fetchGraph])

  const openEditCost = useCallback(
    (id: string) => {
      const c = graph?.costItems.find((x) => x.id === id)
      if (!c) return
      setEditCostId(id)
      setEcName(c.name)
      setEcDescription(c.description ?? '')
      setEcAmount(numberToBrlField(Number(c.amount) || 0))
      setEcCurrency(c.currency || 'BRL')
      setEcStatus(c.status)
      setEcCategory(c.category)
      setEcIsActive(c.is_active !== false)
      setEcActivities(c.activities_description ?? '')
      setEcResultDesc(c.result_savings_description ?? '')
      setEcResultAmount(c.result_savings_amount != null ? numberToBrlField(c.result_savings_amount) : '')
      setEditCostErr(null)
      setEditCostOpen(true)
    },
    [graph]
  )

  const handleSaveEditCost = async () => {
    if (!editCostId) return
    if (!ecName.trim()) {
      setEditCostErr('Informe o nome')
      return
    }
    setSaving(true)
    setEditCostErr(null)
    try {
      await patchJson(`/api/cost-items/${editCostId}`, {
        name: ecName.trim(),
        description: ecDescription.trim() || null,
        amount: brlFieldToNumber(ecAmount),
        currency: ecCurrency,
        status: ecStatus,
        category: ecCategory,
        is_active: ecIsActive,
        activities_description: ecActivities.trim() || null,
        result_savings_description: ecResultDesc.trim() || null,
        result_savings_amount: ecResultAmount.trim() === '' ? null : brlFieldToNumber(ecResultAmount),
      })
      setEditCostOpen(false)
      setEditCostId(null)
      await fetchGraph()
    } catch (e) {
      setEditCostErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const resetNewCostForm = useCallback(() => {
    setNcIsFixed(true)
    setNcVarKind('punctual')
    setCostName('')
    setCostAmount(numberToBrlField(0))
    setCostCategory('ferramenta')
    setCostDeptId('')
    setNcPeriodStart('')
    setNcPeriodEnd('')
    setNcVarTitle('')
    setNcVarDesc('')
    setNcVarAmount(numberToBrlField(0))
    setNcVarCurrency('BRL')
    setNcVarDate(new Date().toISOString().slice(0, 10))
  }, [])

  const openNewCostVariableForDept = useCallback(
    (departmentId: string) => {
      setFormErr(null)
      resetNewCostForm()
      setNcIsFixed(false)
      setNcVarKind('punctual')
      setCostDeptId(departmentId)
      setNewCostDialogOpen(true)
    },
    [resetNewCostForm]
  )

  const handleCreateDept = async () => {
    if (!deptName.trim()) {
      setFormErr('Informe o nome')
      return
    }
    if (!deptOrgEntryId) {
      setFormErr('Selecione o responsável do departamento no organograma')
      return
    }
    if (orgEntries.length === 0) {
      setFormErr('Cadastre pessoas em Organograma da Empresa antes de criar um departamento de custo')
      return
    }
    setSaving(true)
    setFormErr(null)
    try {
      const created = (await postJson('/api/departments', {
        name: deptName.trim(),
        description: deptDesc.trim() || null,
      })) as { id: string }
      if (created?.id) {
        await updateEntry(deptOrgEntryId, { department_id: created.id })
        await fetchEntries()
      }
      setDeptDialog(false)
      setDeptName('')
      setDeptDesc('')
      setDeptOrgEntryId('')
      await fetchGraph()
      const spawn = canvasSpawnRef.current
      canvasSpawnRef.current = null
      if (spawn && created?.id) {
        setPendingNodePlacement({ nodeId: `dept-${created.id}`, x: spawn.x, y: spawn.y })
      }
    } catch (e) {
      setFormErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNewCost = async () => {
    if (!costDeptId) {
      setFormErr('Selecione o departamento')
      return
    }
    setSaving(true)
    setFormErr(null)
    try {
      if (ncIsFixed) {
        if (!costName.trim()) {
          setFormErr('Informe o nome do custo')
          setSaving(false)
          return
        }
        const created = (await postJson('/api/cost-items', {
          name: costName.trim(),
          amount: brlFieldToNumber(costAmount),
          category: costCategory,
          status: 'analise',
          is_active: true,
        })) as { id: string }
        await postJson(`/api/departments/${costDeptId}/costs`, { cost_id: created.id })
        setNewCostDialogOpen(false)
        resetNewCostForm()
        await fetchGraph()
        const spawn = canvasSpawnRef.current
        canvasSpawnRef.current = null
        if (spawn && created?.id) {
          setPendingNodePlacement({ nodeId: `cost-${created.id}`, x: spawn.x, y: spawn.y })
        }
      } else if (ncVarKind === 'punctual') {
        if (!ncVarTitle.trim()) {
          setFormErr('Informe o título do custo')
          setSaving(false)
          return
        }
        if (!ncVarDate) {
          setFormErr('Informe a data de referência')
          setSaving(false)
          return
        }
        await postJson('/api/cost-management/punctual-costs', {
          department_id: costDeptId,
          title: ncVarTitle.trim(),
          description: ncVarDesc.trim() || null,
          amount: brlFieldToNumber(ncVarAmount),
          currency: ncVarCurrency,
          reference_date: ncVarDate.slice(0, 10),
          timing_kind: 'punctual',
        })
        setNewCostDialogOpen(false)
        resetNewCostForm()
        await fetchGraph()
        canvasSpawnRef.current = null
      } else {
        if (!ncVarTitle.trim()) {
          setFormErr('Informe o título do custo')
          setSaving(false)
          return
        }
        if (!ncPeriodStart || !ncPeriodEnd) {
          setFormErr('Informe a data inicial e final do período')
          setSaving(false)
          return
        }
        if (ncPeriodEnd < ncPeriodStart) {
          setFormErr('A data final deve ser igual ou posterior à inicial')
          setSaving(false)
          return
        }
        const months = inclusiveMonthCount(ncPeriodStart, ncPeriodEnd)
        if (months <= 0) {
          setFormErr('Período inválido')
          setSaving(false)
          return
        }
        await postJson('/api/cost-management/punctual-costs', {
          department_id: costDeptId,
          title: ncVarTitle.trim(),
          description: ncVarDesc.trim() || null,
          amount: brlFieldToNumber(ncVarAmount),
          currency: ncVarCurrency,
          timing_kind: 'period',
          period_start_date: ncPeriodStart.slice(0, 10),
          period_end_date: ncPeriodEnd.slice(0, 10),
        })
        setNewCostDialogOpen(false)
        resetNewCostForm()
        await fetchGraph()
        canvasSpawnRef.current = null
      }
    } catch (e) {
      setFormErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleLink = async () => {
    if (!linkDeptId || !linkCostId) {
      setFormErr('Selecione departamento e custo')
      return
    }
    setSaving(true)
    setFormErr(null)
    try {
      await postJson(`/api/departments/${linkDeptId}/costs`, { cost_id: linkCostId })
      setLinkDialog(false)
      await fetchGraph()
    } catch (e) {
      setFormErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }


  const openPunctualDialogEdit = useCallback((row: PunctualCostRow) => {
    const isPeriod = row.timing_kind === 'period'
    setPunctualEditId(row.id)
    setPunctualDeptId(row.department_id)
    setPunctualTitle(row.title)
    setPunctualDesc(row.description ?? '')
    setPunctualAmount(numberToBrlField(Number(row.amount) || 0))
    setPunctualCurrency(row.currency || 'BRL')
    setPunctualTimingKind(isPeriod ? 'period' : 'punctual')
    setPunctualDate(row.reference_date.slice(0, 10))
    setPunctualPeriodStart((row.period_start_date ?? row.reference_date).slice(0, 10))
    setPunctualPeriodEnd((row.period_end_date ?? row.period_start_date ?? '').slice(0, 10))
    setFormErr(null)
    setPunctualDialog(true)
  }, [])

  const handleSavePunctual = async () => {
    if (!punctualEditId) return
    if (!punctualTitle.trim()) {
      setFormErr('Informe o título')
      return
    }
    if (punctualTimingKind === 'punctual' && !punctualDate) {
      setFormErr('Informe a data de referência')
      return
    }
    if (punctualTimingKind === 'period') {
      if (!punctualPeriodStart || !punctualPeriodEnd) {
        setFormErr('Informe o período (data inicial e final)')
        return
      }
      if (punctualPeriodEnd < punctualPeriodStart) {
        setFormErr('A data final deve ser igual ou posterior à inicial')
        return
      }
    }
    setSaving(true)
    setFormErr(null)
    try {
      if (punctualTimingKind === 'period') {
        await patchJson(`/api/cost-management/punctual-costs/${punctualEditId}`, {
          title: punctualTitle.trim(),
          description: punctualDesc.trim() || null,
          amount: brlFieldToNumber(punctualAmount),
          currency: punctualCurrency,
          timing_kind: 'period',
          period_start_date: punctualPeriodStart.slice(0, 10),
          period_end_date: punctualPeriodEnd.slice(0, 10),
        })
      } else {
        await patchJson(`/api/cost-management/punctual-costs/${punctualEditId}`, {
          title: punctualTitle.trim(),
          description: punctualDesc.trim() || null,
          amount: brlFieldToNumber(punctualAmount),
          currency: punctualCurrency,
          timing_kind: 'punctual',
          reference_date: punctualDate.slice(0, 10),
        })
      }
      setPunctualDialog(false)
      setPunctualEditId(null)
      await fetchGraph()
    } catch (e) {
      setFormErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePunctualCost = useCallback(
    async (id: string) => {
      if (!window.confirm('Excluir este custo pontual?')) return
      try {
        await deleteJson(`/api/cost-management/punctual-costs/${id}`)
        await fetchGraph()
      } catch (e) {
        window.alert((e as Error).message)
      }
    },
    [deleteJson, fetchGraph]
  )

  const handleLinkCostToDepartment = useCallback(
    async (departmentId: string, costId: string) => {
      await postJson(`/api/departments/${departmentId}/costs`, { cost_id: costId })
      await fetchGraph()
    },
    [postJson, fetchGraph]
  )

  const handleUnlinkCostFromDepartment = useCallback(
    async (departmentId: string, costId: string) => {
      await deleteJson(`/api/departments/${departmentId}/costs/${costId}`)
      await fetchGraph()
    },
    [deleteJson, fetchGraph]
  )

  const handleOpenCanvasDialog = useCallback(
    (action: CanvasDialogAction, ctx?: CanvasDialogContext) => {
      setFormErr(null)
      const depts = graph?.departments ?? []
      const costs = graph?.costItems ?? []
      const hasFlow = ctx?.flowX != null && ctx?.flowY != null
      if (action === 'dept') {
        canvasSpawnRef.current = hasFlow ? { x: ctx!.flowX!, y: ctx!.flowY! } : null
        setDeptDialog(true)
        return
      }
      if (action === 'cost') {
        canvasSpawnRef.current = hasFlow ? { x: ctx!.flowX!, y: ctx!.flowY! } : null
        resetNewCostForm()
        setCostDeptId(ctx?.departmentId ?? '')
        setNewCostDialogOpen(true)
        return
      }
      canvasSpawnRef.current = null
      if (action === 'link') {
        setLinkDialog(true)
        setFormErr(null)
        if (ctx?.departmentId) setLinkDeptId(ctx.departmentId)
        else if (depts[0]) setLinkDeptId(depts[0].id)
        if (ctx?.costId) setLinkCostId(ctx.costId)
        else if (costs[0]) setLinkCostId(costs[0].id)
      }
    },
    [graph?.departments, graph?.costItems, resetNewCostForm]
  )

  const refreshCostGraph = useCallback(async () => {
    await fetchGraph()
  }, [fetchGraph])

  const consumePendingCanvasNode = useCallback(() => setPendingNodePlacement(null), [])

  return (
    <ProtectedRoute role="admin">
      <Box
        sx={{
          height: `calc(100dvh - ${MAIN_HEADER_PX}px)`,
          maxHeight: `calc(100dvh - ${MAIN_HEADER_PX}px)`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
          p: { xs: 2, md: 3 },
          pb: 2,
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <DollarSign style={{ color: 'var(--mui-palette-primary-main)', width: 32, height: 32 }} />
              <Typography variant="h5" component="h1" fontWeight={600}>
                Custos do Departamento
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<Plus size={18} />} onClick={openManageDialog} sx={{ ml: { md: 'auto' } }}>
              Gerenciar custos do departamento
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, maxWidth: 900 }}>
            Mapa no mesmo estilo do organograma (layout automático + grade). <strong>Clique</strong> em um card para
            abrir o painel à direita. O <strong>responsável do departamento</strong> é escolhido ao criar o centro de
            custo; o time segue a hierarquia do organograma. <strong>Custos fixos</strong> são cadastrados já vinculados
            ao departamento. <strong>Arraste</strong> entre departamento e custo para vincular custos existentes;{' '}
            <strong>Delete</strong> na aresta remove o vínculo. <strong>Botão direito</strong> no mapa para ações rápidas.
          </Typography>

          {error?.includes('MIGRATION') || error?.includes('migração') ? (
            <Alert severity="warning" sx={{ mb: 1.5 }}>
              Execute <strong>backend/migrations/003_cost_management.sql</strong> no Supabase.
            </Alert>
          ) : null}
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <CostTreeFlow
            graph={graph}
            loading={loading}
            error={error}
            canvasFocus={canvasFocus}
            onCanvasFocusChange={setCanvasFocus}
            onLinkCostToDepartment={handleLinkCostToDepartment}
            onUnlinkCostFromDepartment={handleUnlinkCostFromDepartment}
            onRefreshGraph={refreshCostGraph}
            onOpenCanvasDialog={handleOpenCanvasDialog}
            pendingNodePlacement={pendingNodePlacement}
            onConsumedPendingNodePlacement={consumePendingCanvasNode}
            orgEntries={orgEntries}
            fillHeight
          />
        </Box>

        <Drawer
          anchor="right"
          open={Boolean(canvasFocus)}
          onClose={closeCostDrawer}
          hideBackdrop
          sx={{
            pointerEvents: 'none',
            '& .MuiDrawer-paper': { pointerEvents: 'auto' },
          }}
          PaperProps={{
            sx: {
              width: DRAWER_WIDTH,
              maxWidth: '100vw',
              boxSizing: 'border-box',
              borderLeft: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: (t) => t.shadows[12],
            },
          }}
        >
          <Box
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <CostCanvasDrawerPanel
              focus={canvasFocus}
              graph={graph}
              entryLabel={entryLabel}
              responsiblesForDept={responsiblesForDept}
              orgEntries={orgEntries}
              onAddVariableCost={
                canvasFocus?.kind === 'department'
                  ? () => openNewCostVariableForDept(canvasFocus.departmentId)
                  : undefined
              }
              onEditPunctualCost={openPunctualDialogEdit}
              onDeletePunctualCost={(id) => void handleDeletePunctualCost(id)}
              headerActions={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {canvasFocus?.kind === 'department' ? (
                    <Tooltip title="Editar departamento">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setDrawerDeptEditOpen(true)
                          setDrawerMemberEditOpen(false)
                        }}
                        aria-label="Editar departamento"
                      >
                        <Pencil size={18} />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                  {canvasFocus?.kind === 'cost' ? (
                    <Tooltip title="Abrir edição completa do custo">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => openEditCost(canvasFocus.costId)}
                        aria-label="Editar custo"
                      >
                        <Pencil size={18} />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                  {canvasFocus?.kind === 'member' ? (
                    <Tooltip title="Editar custo mensal">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setDrawerMemberEditOpen(true)}
                        aria-label="Editar pessoa"
                      >
                        <Pencil size={18} />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                  <Tooltip title="Fechar painel">
                    <IconButton size="small" onClick={closeCostDrawer} aria-label="Fechar">
                      <X size={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              onEditCostFull={openEditCost}
              drawerDeptEditOpen={drawerDeptEditOpen}
              onOpenDrawerDeptEdit={() => setDrawerDeptEditOpen(true)}
              onCancelDrawerDeptEdit={() => setDrawerDeptEditOpen(false)}
              drawerDeptName={drawerDeptName}
              setDrawerDeptName={setDrawerDeptName}
              drawerDeptDesc={drawerDeptDesc}
              setDrawerDeptDesc={setDrawerDeptDesc}
              drawerDeptErr={drawerDeptErr}
              drawerDeptSaving={drawerDeptSaving}
              onSaveDrawerDept={() => void saveDrawerDepartment()}
              drawerMemberEditOpen={drawerMemberEditOpen}
              onOpenDrawerMemberEdit={() => setDrawerMemberEditOpen(true)}
              onCancelDrawerMemberEdit={() => setDrawerMemberEditOpen(false)}
              drawerMemberCost={drawerMemberCost}
              setDrawerMemberCost={setDrawerMemberCost}
              drawerMemberErr={drawerMemberErr}
              drawerMemberSaving={drawerMemberSaving}
              onSaveDrawerMember={() => void saveDrawerMember()}
              footerActions={
                canvasFocus ? (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Trash2 size={16} />}
                    onClick={openCostDeletePreview}
                    disabled={costDeleteBusy}
                  >
                    {costDeleteButtonLabel}
                  </Button>
                ) : null
              }
            />
            </Box>
          </Box>
        </Drawer>

        <Dialog
          open={costDeletePreviewOpen}
          onClose={costDeleteBusy ? undefined : closeCostDeleteFlow}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Prévia da exclusão</DialogTitle>
          <DialogContent sx={{ pt: 1.5 }}>
            {costDeleteError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {costDeleteError}
              </Alert>
            ) : null}
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              Confira o que será alterado (<strong>{costDeletePreviewRows.length}</strong> linha(s)).
            </Typography>
            <Box sx={{ maxHeight: 260, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
              {costDeletePreviewRows.map((row) => (
                <Box
                  key={row.key}
                  sx={{
                    py: 0.5,
                    px: 0.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {row.title}
                  </Typography>
                  {row.subtitle ? (
                    <Typography variant="caption" color="text.secondary" component="div">
                      {row.subtitle}
                    </Typography>
                  ) : null}
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCostDeleteFlow} disabled={costDeleteBusy}>
              Cancelar
            </Button>
            <Button color="error" variant="contained" onClick={goToCostDeleteFinalConfirm} disabled={costDeleteBusy}>
              Continuar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={costDeleteConfirmOpen}
          onClose={costDeleteBusy ? undefined : closeCostDeleteFlow}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirmar exclusão</DialogTitle>
          <DialogContent sx={{ pt: 1.5 }}>
            {costDeleteError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {costDeleteError}
              </Alert>
            ) : null}
            <Typography variant="body2">
              Confirma a operação definitiva sobre <strong>{costDeletePreviewRows.length}</strong> linha(s) listadas?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCostDeleteFlow} disabled={costDeleteBusy}>
              Voltar
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => void confirmCostDelete()}
              disabled={costDeleteBusy}
            >
              {costDeleteBusy ? 'Excluindo...' : 'Excluir definitivamente'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Painel único de ações (como &quot;Gerenciar organograma&quot;) */}
        <Dialog open={manageDialogOpen} onClose={() => setManageDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Gerenciar custos do departamento</DialogTitle>
          <DialogContent>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Tooltip title="Atualizar mapa e organograma">
                <IconButton
                  color="primary"
                  onClick={() => {
                    void fetchGraph()
                    void fetchEntries()
                  }}
                  aria-label="Atualizar dados"
                >
                  <RefreshCw size={20} />
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography variant="subtitle2" gutterBottom>
              Ações
            </Typography>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Building2 size={18} />}
                onClick={() => {
                  setManageDialogOpen(false)
                  canvasSpawnRef.current = null
                  setDeptDialog(true)
                }}
              >
                Novo departamento…
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Plus size={18} />}
                onClick={() => {
                  setManageDialogOpen(false)
                  canvasSpawnRef.current = null
                  resetNewCostForm()
                  setNewCostDialogOpen(true)
                }}
              >
                Novo custo…
              </Button>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Departamentos e responsáveis (organograma)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Responsáveis cadastrados no organograma</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(graph?.departments ?? []).map((d) => {
                  const rs = responsiblesForDept(d.id)
                  return (
                    <TableRow key={d.id}>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>
                        {rs.length === 0 ? (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        ) : (
                          rs.map((e: OrgEntry) => entryLabel(e)).join(' · ')
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setManageDialogOpen(false)}>Fechar</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog: departamento */}
        <Dialog
          open={deptDialog}
          onClose={() => {
            setDeptDialog(false)
            setDeptOrgEntryId('')
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Novo departamento</DialogTitle>
          <DialogContent>
            {formErr && deptDialog ? <Alert severity="error" sx={{ mb: 2 }}>{formErr}</Alert> : null}
            <TextField
              label="Nome"
              fullWidth
              margin="normal"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
            />
            <TextField
              label="Descrição"
              fullWidth
              margin="normal"
              multiline
              minRows={2}
              value={deptDesc}
              onChange={(e) => setDeptDesc(e.target.value)}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Responsável no organograma</InputLabel>
              <Select
                value={deptOrgEntryId}
                label="Responsável no organograma"
                onChange={(e) => setDeptOrgEntryId(e.target.value)}
              >
                {orgEntries.map((e: OrgEntry) => (
                  <MenuItem key={e.id} value={e.id}>
                    {entryLabel(e)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: -0.5, mb: 1 }}>
              Cadastre pessoas em <strong>Organograma da Empresa</strong>. O time do departamento segue a hierarquia
              abaixo desta pessoa.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeptDialog(false)}>Cancelar</Button>
            <Button variant="contained" onClick={() => void handleCreateDept()} disabled={saving}>
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog: novo custo (fixo ou variável) */}
        <Dialog
          open={newCostDialogOpen}
          onClose={() => {
            setNewCostDialogOpen(false)
            resetNewCostForm()
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Novo custo</DialogTitle>
          <DialogContent>
            {formErr && newCostDialogOpen ? <Alert severity="error" sx={{ mb: 2 }}>{formErr}</Alert> : null}
            <FormControl component="fieldset" margin="normal" fullWidth>
              <FormLabel component="legend">Tipo</FormLabel>
              <RadioGroup
                row
                value={ncIsFixed ? 'fixed' : 'variable'}
                onChange={(_, v) => {
                  setNcIsFixed(v === 'fixed')
                  setFormErr(null)
                }}
              >
                <FormControlLabel value="fixed" control={<Radio size="small" />} label="Fixo (mensal recorrente)" />
                <FormControlLabel value="variable" control={<Radio size="small" />} label="Variável (não fixo)" />
              </RadioGroup>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Departamento</InputLabel>
              <Select value={costDeptId} label="Departamento" onChange={(e) => setCostDeptId(e.target.value)}>
                {(graph?.departments ?? []).map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {ncIsFixed ? (
              <>
                <TextField
                  label="Nome"
                  fullWidth
                  margin="normal"
                  value={costName}
                  onChange={(e) => setCostName(e.target.value)}
                />
                <TextField
                  label="Valor (mensal)"
                  fullWidth
                  margin="normal"
                  type="text"
                  inputMode="decimal"
                  value={costAmount}
                  onChange={(e) => setCostAmount(e.target.value)}
                  placeholder="Ex.: 1.250,50"
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Categoria</InputLabel>
                  <Select value={costCategory} label="Categoria" onChange={(e) => setCostCategory(e.target.value)}>
                    <MenuItem value="ferramenta">Ferramenta</MenuItem>
                    <MenuItem value="licenca">Licença</MenuItem>
                    <MenuItem value="infraestrutura">Infraestrutura</MenuItem>
                    <MenuItem value="servico">Serviço</MenuItem>
                    <MenuItem value="outro">Outro</MenuItem>
                  </Select>
                </FormControl>
              </>
            ) : (
              <>
                <FormControl component="fieldset" margin="normal" fullWidth>
                  <FormLabel component="legend">Como entra no tempo</FormLabel>
                  <RadioGroup
                    row
                    value={ncVarKind}
                    onChange={(_, v) => {
                      setNcVarKind(v as 'punctual' | 'period')
                      setFormErr(null)
                    }}
                  >
                    <FormControlLabel value="punctual" control={<Radio size="small" />} label="Pontual (uma data)" />
                    <FormControlLabel value="period" control={<Radio size="small" />} label="Período" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  label="Título"
                  fullWidth
                  margin="normal"
                  value={ncVarTitle}
                  onChange={(e) => setNcVarTitle(e.target.value)}
                />
                <TextField
                  label="Descrição (opcional)"
                  fullWidth
                  margin="normal"
                  multiline
                  minRows={2}
                  value={ncVarDesc}
                  onChange={(e) => setNcVarDesc(e.target.value)}
                />
                {ncVarKind === 'punctual' ? (
                  <TextField
                    label="Data de referência"
                    type="date"
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    value={ncVarDate}
                    onChange={(e) => setNcVarDate(e.target.value)}
                  />
                ) : (
                  <>
                    <TextField
                      label="De (data inicial)"
                      type="date"
                      fullWidth
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                      value={ncPeriodStart}
                      onChange={(e) => setNcPeriodStart(e.target.value)}
                    />
                    <TextField
                      label="Até (data final)"
                      type="date"
                      fullWidth
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                      value={ncPeriodEnd}
                      onChange={(e) => setNcPeriodEnd(e.target.value)}
                    />
                    {ncPeriodStart && ncPeriodEnd && ncPeriodEnd >= ncPeriodStart ? (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        {(() => {
                          const m = inclusiveMonthCount(ncPeriodStart, ncPeriodEnd)
                          const total = brlFieldToNumber(ncVarAmount)
                          if (m <= 0) return null
                          const parts = splitTotalAcrossMonths(total, m)
                          const per = parts[0] ?? 0
                          return (
                            <>
                              {m} {m === 1 ? 'mês' : 'meses'} no período. Valor total rateado para dashboards mensais:{' '}
                              <strong>
                                {per.toLocaleString('pt-BR', { style: 'currency', currency: ncVarCurrency || 'BRL' })}
                              </strong>
                              {m > 1 ? ' /mês (último mês ajusta centavos).' : '.'}
                            </>
                          )
                        })()}
                      </Typography>
                    ) : null}
                  </>
                )}
                <TextField
                  label={ncVarKind === 'period' ? 'Valor total do período' : 'Valor'}
                  fullWidth
                  margin="normal"
                  type="text"
                  inputMode="decimal"
                  value={ncVarAmount}
                  onChange={(e) => setNcVarAmount(e.target.value)}
                  placeholder="Ex.: 1.250,50"
                />
                <TextField
                  label="Moeda"
                  fullWidth
                  margin="normal"
                  value={ncVarCurrency}
                  onChange={(e) => setNcVarCurrency(e.target.value.slice(0, 8).toUpperCase() || 'BRL')}
                  placeholder="BRL"
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setNewCostDialogOpen(false)
                resetNewCostForm()
              }}
            >
              Cancelar
            </Button>
            <Button variant="contained" onClick={() => void handleSaveNewCost()} disabled={saving}>
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog: vincular */}
        <Dialog open={linkDialog} onClose={() => setLinkDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Vincular custo ao departamento</DialogTitle>
          <DialogContent>
            {formErr && linkDialog ? <Alert severity="error" sx={{ mb: 2 }}>{formErr}</Alert> : null}
            <FormControl fullWidth margin="normal">
              <InputLabel>Departamento</InputLabel>
              <Select value={linkDeptId} label="Departamento" onChange={(e) => setLinkDeptId(e.target.value)}>
                {(graph?.departments ?? []).map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Custo</InputLabel>
              <Select value={linkCostId} label="Custo" onChange={(e) => setLinkCostId(e.target.value)}>
                {(graph?.costItems ?? []).map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLinkDialog(false)}>Cancelar</Button>
            <Button variant="contained" onClick={() => void handleLink()} disabled={saving}>
              Vincular
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog: editar custo */}
        <Dialog
          open={editCostOpen}
          onClose={() => {
            setEditCostOpen(false)
            setEditCostId(null)
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Editar custo fixo</DialogTitle>
          <DialogContent>
            {editCostErr ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {editCostErr}
              </Alert>
            ) : null}
            <TextField label="Nome" fullWidth margin="normal" value={ecName} onChange={(e) => setEcName(e.target.value)} />
            <TextField
              label="Descrição"
              fullWidth
              margin="normal"
              multiline
              minRows={2}
              value={ecDescription}
              onChange={(e) => setEcDescription(e.target.value)}
            />
            <TextField
              label="Valor (mensal)"
              fullWidth
              margin="normal"
              type="text"
              inputMode="decimal"
              value={ecAmount}
              onChange={(e) => setEcAmount(e.target.value)}
              placeholder="Ex.: 2.000,00"
            />
            <TextField
              label="Moeda"
              fullWidth
              margin="normal"
              value={ecCurrency}
              onChange={() => setEcCurrency('BRL')}
              placeholder="BRL"
              disabled
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select value={ecStatus} label="Status" onChange={(e) => setEcStatus(e.target.value)}>
                <MenuItem value="analise">Análise</MenuItem>
                <MenuItem value="ativo">Ativo</MenuItem>
                <MenuItem value="desativado">Desativado</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Categoria</InputLabel>
              <Select value={ecCategory} label="Categoria" onChange={(e) => setEcCategory(e.target.value)}>
                <MenuItem value="ferramenta">Ferramenta</MenuItem>
                <MenuItem value="licenca">Licença</MenuItem>
                <MenuItem value="infraestrutura">Infraestrutura</MenuItem>
                <MenuItem value="servico">Serviço</MenuItem>
                <MenuItem value="outro">Outro</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={ecIsActive} onChange={(e) => setEcIsActive(e.target.checked)} />}
              label="Custo ativo (conta nos totais operacionais)"
              sx={{ mt: 1, display: 'block' }}
            />
            <TextField
              label="Atividades que este custo viabiliza (Y)"
              fullWidth
              margin="normal"
              multiline
              minRows={2}
              value={ecActivities}
              onChange={(e) => setEcActivities(e.target.value)}
              helperText="Narrativa de validação da operação"
            />
            <TextField
              label="Resultado / economia para a empresa (Z)"
              fullWidth
              margin="normal"
              multiline
              minRows={2}
              value={ecResultDesc}
              onChange={(e) => setEcResultDesc(e.target.value)}
            />
            <TextField
              label="Valor estimado de resultado/economia (opcional)"
              fullWidth
              margin="normal"
              type="text"
              inputMode="decimal"
              value={ecResultAmount}
              onChange={(e) => setEcResultAmount(e.target.value)}
              placeholder="Ex.: 500,00"
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setEditCostOpen(false)
                setEditCostId(null)
              }}
            >
              Cancelar
            </Button>
            <Button variant="contained" onClick={() => void handleSaveEditCost()} disabled={saving}>
              Salvar alterações
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog: editar custo variável (pontual ou período) */}
        <Dialog
          open={punctualDialog}
          onClose={() => {
            setPunctualDialog(false)
            setPunctualEditId(null)
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Editar custo variável</DialogTitle>
          <DialogContent>
            {formErr && punctualDialog ? <Alert severity="error" sx={{ mb: 2 }}>{formErr}</Alert> : null}
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
              Novos lançamentos: use <strong>Gerenciar</strong> ou <strong>Novo custo variável</strong> no painel do
              departamento. Aqui você ajusta um registro já existente.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Departamento:{' '}
              <strong>{graph?.departments.find((d) => d.id === punctualDeptId)?.name ?? '—'}</strong>
            </Typography>
            <FormControl component="fieldset" margin="normal" fullWidth>
              <FormLabel component="legend">Tipo</FormLabel>
              <RadioGroup
                row
                value={punctualTimingKind}
                onChange={(_, v) => setPunctualTimingKind(v as 'punctual' | 'period')}
              >
                <FormControlLabel value="punctual" control={<Radio size="small" />} label="Pontual" />
                <FormControlLabel value="period" control={<Radio size="small" />} label="Período" />
              </RadioGroup>
            </FormControl>
            <TextField
              label="Título"
              fullWidth
              margin="normal"
              value={punctualTitle}
              onChange={(e) => setPunctualTitle(e.target.value)}
              placeholder="Ex.: Treinamento externo"
            />
            <TextField
              label="Descrição (opcional)"
              fullWidth
              margin="normal"
              multiline
              minRows={2}
              value={punctualDesc}
              onChange={(e) => setPunctualDesc(e.target.value)}
            />
            {punctualTimingKind === 'punctual' ? (
              <TextField
                label="Data de referência"
                type="date"
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                value={punctualDate}
                onChange={(e) => setPunctualDate(e.target.value)}
              />
            ) : (
              <>
                <TextField
                  label="De (data inicial)"
                  type="date"
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  value={punctualPeriodStart}
                  onChange={(e) => setPunctualPeriodStart(e.target.value)}
                />
                <TextField
                  label="Até (data final)"
                  type="date"
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  value={punctualPeriodEnd}
                  onChange={(e) => setPunctualPeriodEnd(e.target.value)}
                />
              </>
            )}
            <TextField
              label={punctualTimingKind === 'period' ? 'Valor total do período' : 'Valor'}
              fullWidth
              margin="normal"
              type="text"
              inputMode="decimal"
              value={punctualAmount}
              onChange={(e) => setPunctualAmount(e.target.value)}
              placeholder="Ex.: 1.250,50"
            />
            <TextField
              label="Moeda"
              fullWidth
              margin="normal"
              value={punctualCurrency}
              onChange={(e) => setPunctualCurrency(e.target.value.slice(0, 8).toUpperCase() || 'BRL')}
              placeholder="BRL"
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setPunctualDialog(false)
                setPunctualEditId(null)
              }}
            >
              Cancelar
            </Button>
            <Button variant="contained" onClick={() => void handleSavePunctual()} disabled={saving || !punctualEditId}>
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ProtectedRoute>
  )
}

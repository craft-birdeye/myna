export { CoachAgentPanel } from './CoachAgentPanel/CoachAgentPanel'
export type { CoachAgentPanelProps } from './CoachAgentPanel/CoachAgentPanel.types'
export { AiAssistPanel } from './AiAssistPanel/AiAssistPanel'
export type { AiAssistPanelProps } from './AiAssistPanel/AiAssistPanel.types'
export { AiBuilderPanel } from './AiBuilderPanel/AiBuilderPanel'
export type { AiBuilderPanelProps } from './AiBuilderPanel/AiBuilderPanel.types'
export {
  CallTranscriptSection,
  getUserRatingForLogStatus,
  RunConversationThread,
  RunDetailsPanel,
} from './RunDetailsPanel/RunDetailsPanel'
export { TestRunPanel } from './TestRunPanel/TestRunPanel'
export type { TestRunPanelProps, TestRunStepStatus } from './TestRunPanel/TestRunPanel.types'
export type {
  RunConversationEntry,
  RunDetailsPanelProps,
  RunLogField,
  RunLogStep,
  RunLogStepType,
} from './RunDetailsPanel/RunDetailsPanel.types'
export { Chip } from './Chip/Chip'
export { Block } from './Block/Block'
export type { BlockProps, BlockVariant } from './Block/Block.types'
export { ProcedureSidePanel } from './ProcedureSidePanel/ProcedureSidePanel'
export type { ProcedureSidePanelProps, ProcedureSidePanelStep } from './ProcedureSidePanel/ProcedureSidePanel.types'
export { TranscriptSidePanel } from './TranscriptSidePanel/TranscriptSidePanel'
export type { TranscriptSidePanelProps, TranscriptSidePanelLine } from './TranscriptSidePanel/TranscriptSidePanel.types'
export { ChatBubble, ChatSystemLabel } from './ChatBubble/ChatBubble'
export type {
  ChatBubbleProps,
  ChatSender,
  MessageFeedbackValue,
} from './ChatBubble/ChatBubble.types'
export { EmptyState } from './EmptyState/EmptyState'
export type { EmptyStateProps } from './EmptyState/EmptyState.types'
export { InfoTooltip } from './InfoTooltip/InfoTooltip'
export { Tooltip } from './Tooltip/Tooltip'
export type { TooltipProps, TooltipVariant, TooltipSide } from './Tooltip/Tooltip.types'
export {
  VoiceCallEngineSettings,
  TtsModelSettings,
  TtsFailoverSettings,
  DEFAULT_TTS_MODEL_SETTINGS,
  DEFAULT_TTS_FAILOVER_SETTINGS,
  DEFAULT_STT_SETTINGS,
} from './VoiceCallEngineSettings/VoiceCallEngineSettings'
export type {
  TtsModelSettingsValue,
  TtsFailoverSettingsValue,
  SttSettingsValue,
} from './VoiceCallEngineSettings/VoiceCallEngineSettings'
export {
  AdditionalVoiceDrawer,
  AGENT_VOICE_OPTIONS,
  DEFAULT_AGENT_VOICE,
  DefaultVoiceDrawer,
  VoicePreviewButton,
} from './VoiceSettingsDrawers/VoiceSettingsDrawers'
export type {
  AdditionalVoiceConfig,
  VoiceOption,
} from './VoiceSettingsDrawers/VoiceSettingsDrawers.types'
export { TestCallModal } from './TestCallModal/TestCallModal'
export type { TestCallModalProps } from './TestCallModal/TestCallModal.types'
export { BookTestAppointmentModal } from './BookTestAppointmentModal/BookTestAppointmentModal'
export type {
  BookTestAppointmentModalProps,
  BookTestAppointmentValues,
} from './BookTestAppointmentModal/BookTestAppointmentModal.types'
export { AeroFormModal } from './AeroFormModal/AeroFormModal'
export { ContextModal } from './ContextModal/ContextModal'
export { CustomizeColumnsDrawer } from './CustomizeColumnsDrawer/CustomizeColumnsDrawer'
export { EmptyHintField } from './EmptyHintField/EmptyHintField'
export { DateChange } from './DateChange/DateChange'
export { DateRangeSelector } from './DateRangeSelector/DateRangeSelector'
export { ReportHeader } from './ReportHeader/ReportHeader'
export { FilterPanel } from './FilterPanel/FilterPanel'
export { HeaderSearchField } from './HeaderSearchField/HeaderSearchField'
export { FormDrawer } from './FormDrawer/FormDrawer'
export { ScheduleDemoPanel } from './ScheduleDemoPanel/ScheduleDemoPanel'
export { ProceduresPickerDrawer } from './ProceduresPickerDrawer/ProceduresPickerDrawer'
export { IntegrationsPickerDrawer } from './IntegrationsPickerDrawer/IntegrationsPickerDrawer'
export { ProcedureListCard } from './ProcedureListCard/ProcedureListCard'
export { ProcedureSelectCard } from './ProcedureSelectCard/ProcedureSelectCard'
export { IntegrationListCard } from './IntegrationListCard/IntegrationListCard'
export { IntegrationSelectCard } from './IntegrationSelectCard/IntegrationSelectCard'
export type { ProcedureListCardProps } from './ProcedureListCard/ProcedureListCard'
export type { ProcedureSelectCardProps } from './ProcedureSelectCard/ProcedureSelectCard.types'
export type { IntegrationSelectCardProps } from './IntegrationSelectCard/IntegrationSelectCard.types'
export { IntakeFormPreviewDrawer } from './IntakeFormPreviewDrawer/IntakeFormPreviewDrawer'
export { InfoCard } from './InfoCard/InfoCard'
export { InfoCardListItem } from './InfoCard/InfoCardListItem'
export { LibraryCardIcon } from './LibraryCardIcon/LibraryCardIcon'
export type { LibraryCardGlyph, LibraryCardTone } from './LibraryCardIcon/LibraryCardIcon'
export { Link } from './Link/Link'
export { LogDetailsPanel } from './LogDetailsPanel/LogDetailsPanel'
export type {
  LogDetailsPanelProps,
  LogDetailsMetric,
  LogTranscriptEntry,
  LogToolCall,
} from './LogDetailsPanel/LogDetailsPanel.types'
export { Icon } from './Icon/Icon'
export { IconRail } from './IconRail/IconRail'
export { SideNav } from './SideNav/SideNav'
export { TopNav } from './TopNav/TopNav'
export { PageHeader } from './PageHeader/PageHeader'
export { RefChip } from './RefChip/RefChip'
export { ComposerAttachPopover } from './ComposerAttachPopover/ComposerAttachPopover'
export { AttachMenuPopover } from './AttachMenuPopover/AttachMenuPopover'
export { PromptComposer } from './PromptComposer/PromptComposer'
export { MediaLibraryModal } from './MediaLibraryModal/MediaLibraryModal'
export { FilesModal } from './FilesModal/FilesModal'
export { SelectMenu } from './SelectMenu/SelectMenu'
export { LanguageSelectMenu, LanguageFlag } from './LanguageSelectMenu/LanguageSelectMenu'
export { StatusFilterDropdown } from './StatusFilterDropdown/StatusFilterDropdown'
export { SetupAppointmentDrawer } from './SetupAppointmentDrawer/SetupAppointmentDrawer'
export { BookAppointmentDrawer } from './BookAppointmentDrawer/BookAppointmentDrawer'
export { DatePickerModal } from './DatePickerModal/DatePickerModal'
export { MessageDrawer } from './MessageDrawer/MessageDrawer'
export { QuickSendModal } from './QuickSendModal/QuickSendModal'
export { Toast } from './Toast/Toast'
export { ShareFeedbackModal } from './ShareFeedbackModal/ShareFeedbackModal'
export type { ShareFeedbackModalProps } from './ShareFeedbackModal/ShareFeedbackModal.types'
export { EstimateSavingsModal, REVIEW_RESPONSE_SAVINGS_COPY, parseTimeSavedHours } from './EstimateSavingsModal/EstimateSavingsModal'
export type { EstimateSavingsCopy, EstimateSavingsModalProps, EstimateSavingsValues, SavingsMode } from './EstimateSavingsModal/EstimateSavingsModal.types'
export { AgentsIntroVideoModal } from './AgentsIntroVideoModal/AgentsIntroVideoModal'
export type { AgentsIntroVideoModalProps } from './AgentsIntroVideoModal/AgentsIntroVideoModal.types'
export { WorkflowCoachTour } from './WorkflowCoachTour/WorkflowCoachTour'
export { WORKFLOW_COACH_STEPS } from './WorkflowCoachTour/WorkflowCoachTour.types'
export type {
  WorkflowCoachTourProps,
  WorkflowCoachStep,
  WorkflowCoachPlacement,
} from './WorkflowCoachTour/WorkflowCoachTour.types'
export { HelpCenterPanel } from './HelpCenterPanel/HelpCenterPanel'
export { GlossaryModal } from './HelpCenterPanel/GlossaryModal'
export type { GlossaryModalProps } from './HelpCenterPanel/GlossaryModal'
export type {
  HelpCenterPanelProps,
  HelpCenterView,
  HelpVideoItem,
  HelpArticleItem,
  HelpGlossaryItem,
  HelpDictionaryItem,
} from './HelpCenterPanel/HelpCenterPanel.types'
export { HELP_GLOSSARY, HELP_DICTIONARY } from './HelpCenterPanel/HelpCenterPanel.types'
export { AgentLibraryPreviewModal } from './AgentLibraryPreviewModal/AgentLibraryPreviewModal'
export type {
  AgentLibraryPreviewData,
  AgentLibraryPreviewModalProps,
  AgentLibraryPreviewStep,
} from './AgentLibraryPreviewModal/AgentLibraryPreviewModal.types'
export { ViewActivityDrawer } from './ViewActivityDrawer/ViewActivityDrawer'
export { WeekCalendar } from './WeekCalendar/WeekCalendar'
export { DayCalendar } from './DayCalendar/DayCalendar'
export { QuickViewDrawer } from './QuickViewDrawer/QuickViewDrawer'
export type { QuickViewDrawerProps, PatientDetail, QuickViewAppointment, QuickViewWaitlist } from './QuickViewDrawer/QuickViewDrawer.types'
export { MetricTiles } from './MetricTiles/MetricTiles'
export { Tabs } from './Tabs/Tabs'
export { TabCountPill } from './Tabs/TabCountPill'
export { DataTable } from './DataTable/DataTable'
export { PatientCell } from './PatientCell/PatientCell'
export { RecordDetailScreen } from './RecordDetailScreen/RecordDetailScreen'
export type {
  RecordDetailScreenProps,
  RecordDetailAccordion,
  RecordDetailField,
  RecordDetailMetric,
} from './RecordDetailScreen/RecordDetailScreen.types'

// Charts (Recharts-based + CSS heatmap) — reusable across report pages
export { ChartCard } from './charts/ChartCard'
export { ChartCardButton } from './charts/ChartCardButton'
export { ChartStatRow } from './charts/ChartStatRow'
export { HBarList } from './charts/HBarList'
export { RatingBarChart } from './charts/RatingBarChart'
export { TrendLineChart } from './charts/TrendLineChart'
export { SummaryStats } from './charts/SummaryStats'
export { StackedBarChart } from './charts/StackedBarChart'
export { DonutChart } from './charts/DonutChart'
export { SankeyChart } from './charts/SankeyChart'
export { Heatmap } from './charts/Heatmap'
export { ChartTooltip } from './charts/ChartTooltip'
export { chartColors } from './charts/chartColors'
export type { ChartCardProps } from './charts/ChartCard'
export type { HBarItem, HBarListProps } from './charts/HBarList'
export type { RatingBar, RatingBarChartProps } from './charts/RatingBarChart'
export type { TrendPoint, TrendLineChartProps } from './charts/TrendLineChart'
export type { ChartStat, ChartStatRowProps } from './charts/ChartStatRow'
export type { SummaryStat, SummaryStatsProps } from './charts/SummaryStats'
export { CallRecordingPlayer } from './CallRecordingPlayer/CallRecordingPlayer'
export type { CallRecordingPlayerProps, CallRecordingPlayerHandle } from './CallRecordingPlayer/CallRecordingPlayer.types'
export { CallAiSummary, DEFAULT_CALL_AI_SUMMARY } from './CallAiSummary/CallAiSummary'
export type { CallAiSummaryProps } from './CallAiSummary/CallAiSummary.types'
export { VoicemailMessage } from './VoicemailMessage/VoicemailMessage'
export type { VoicemailMessageProps } from './VoicemailMessage/VoicemailMessage.types'
export { VoiceChatDrawer } from './VoiceChatDrawer/VoiceChatDrawer'
export type { VoiceChatDrawerProps, VoiceChatMessage } from './VoiceChatDrawer/VoiceChatDrawer.types'
export type { BarSeries, StackedBarChartProps } from './charts/StackedBarChart'
export type { DonutDatum, DonutChartProps } from './charts/DonutChart'
export type { SankeyNode, SankeyLink, SankeyChartProps } from './charts/SankeyChart'
export type { HeatmapProps } from './charts/Heatmap'
export type { ChartTooltipItem, ChartTooltipProps } from './charts/ChartTooltip'

export type { LinkProps } from './Link/Link.types'
export type { ChipProps, ChipVariant } from './Chip/Chip.types'
export type { AeroFormModalProps } from './AeroFormModal/AeroFormModal.types'
export type { ContextModalProps, ContextModalResult } from './ContextModal/ContextModal.types'
export type {
  CustomizeColumnsDrawerProps,
  ColumnOption,
} from './CustomizeColumnsDrawer/CustomizeColumnsDrawer.types'
export type { FilterPanelProps, FilterField } from './FilterPanel/FilterPanel.types'
export type { FormDrawerProps, FormField } from './FormDrawer/FormDrawer.types'
export type {
  IntakeFormPreviewDrawerProps,
  IntakePreviewPatient,
  IntakeBasicDetails,
} from './IntakeFormPreviewDrawer/IntakeFormPreviewDrawer.types'
export type { IconProps } from './Icon/Icon.types'
export type { IconRailProps, RailNavItem, RailGroup, Product } from './IconRail/IconRail.types'
export type { SideNavProps, NavSection, NavLeaf } from './SideNav/SideNav.types'
export type { TopNavProps } from './TopNav/TopNav.types'
export type { PageHeaderProps, AppointmentView, AppointmentTimescale } from './PageHeader/PageHeader.types'
export type { RefChipProps } from './RefChip/RefChip.types'
export type { AttachItem, AttachItemKind, ComposerAttachPopoverProps } from './ComposerAttachPopover/ComposerAttachPopover.types'
export type { AttachMenuOption, AttachMenuPopoverProps } from './AttachMenuPopover/AttachMenuPopover.types'
export type { PromptComposerAttachment, PromptComposerProps } from './PromptComposer/PromptComposer.types'
export type { MediaLibraryFile, MediaLibraryFolder, MediaLibraryModalProps } from './MediaLibraryModal/MediaLibraryModal.types'
export type { FilesModalFile, FilesModalFileType, FilesModalProps } from './FilesModal/FilesModal.types'
export type { SelectMenuProps, SelectOption } from './SelectMenu/SelectMenu.types'
export type { StatusFilterDropdownProps, StatusFilterOption } from './StatusFilterDropdown/StatusFilterDropdown.types'
export { ALL_STATUS_IDS, STATUS_FILTER_OPTIONS } from './StatusFilterDropdown/StatusFilterDropdown.types'
export type { SetupAppointmentDrawerProps, SetupAppointmentValues } from './SetupAppointmentDrawer/SetupAppointmentDrawer.types'
export type { DataTableProps, Column, RowAction, RowMenuItem } from './DataTable/DataTable.types'
export type { MessageDrawerProps } from './MessageDrawer/MessageDrawer.types'
export type { QuickSendModalProps } from './QuickSendModal/QuickSendModal.types'
export type { ToastProps } from './Toast/Toast.types'
export type { ViewActivityDrawerProps } from './ViewActivityDrawer/ViewActivityDrawer.types'
export { SendReminderDrawer } from './SendReminderDrawer/SendReminderDrawer'
export type { SendReminderDrawerProps } from './SendReminderDrawer/SendReminderDrawer.types'
export { TemplatePickerModal, TemplateSelectField, TEMPLATE_LIST, TEMPLATE_CATEGORIES } from './TemplatePicker/TemplatePicker'
export type { TemplateItem, TemplateCategory, TemplatePickerModalProps, TemplateSelectFieldProps } from './TemplatePicker/TemplatePicker'
export type { MetricTilesProps, Metric } from './MetricTiles/MetricTiles.types'
export type { TabsProps, Tab } from './Tabs/Tabs.types'
export type { TabCountPillProps } from './Tabs/TabCountPill.types'
export type { DateChangeProps } from './DateChange/DateChange.types'
export type { DateRangeSelectorProps } from './DateRangeSelector/DateRangeSelector.types'
export type { ReportHeaderProps } from './ReportHeader/ReportHeader.types'
export type { InfoCardProps, InfoCardListItemProps } from './InfoCard/InfoCard.types'
export { INFO_CARD_LAYOUT, INFO_CARD_LIST_ITEM_LAYOUT } from './InfoCard/InfoCard.types'

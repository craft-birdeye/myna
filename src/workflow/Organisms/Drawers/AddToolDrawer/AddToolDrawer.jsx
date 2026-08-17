import React, { useState, useEffect } from 'react';
import { getSeedTools, subscribeToCustomTools } from '../../../services/agentService';
import { ToolViewerContent } from '../CustomToolViewer/CustomToolViewer';
import { TransferToolContent } from '../TransferToolDrawer/TransferToolDrawer';
import AutoFollowUp from '../Tools/AutoFollowUp/AutoFollowUp';
import EscalationNotifier from '../Tools/EscalationNotifier/EscalationNotifier';
import LeadCapture from '../Tools/LeadCapture/LeadCapture';
import LeadQualification from '../Tools/LeadQualification/LeadQualification';
import VoicemailDetection from '../Tools/VoicemailDetection/VoicemailDetection';
import styles from './AddToolDrawer.module.css';
import chronoLogo from '../../../../assets/logo-chrono.svg';
import athenaLogo from '../../../../assets/logo-athena.svg';

const TOOL_DRAWER_MAP = {
  'auto-follow-up':       AutoFollowUp,
  'escalation-notifier':  EscalationNotifier,
  'lead-capture':         LeadCapture,
  'lead-qualification':   LeadQualification,
  'voicemail-detection':  VoicemailDetection,
};

/* ─── Brand logos ─── */
const LOGOS = {
  chronos: chronoLogo,
  athena: athenaLogo,
};

/* ─── Mock external integrations ─── */
const EXTERNAL_INTEGRATIONS = [
  { id: 'chronos', name: 'Chronos', description: 'Access patient records, scheduling, and clinical data via the Chronos EHR system.', connected: true  },
  { id: 'athena',  name: 'Athena',  description: 'Access patient records, appointments, and billing data via athenahealth.',          connected: true  },
];

const MOCK_ACCOUNTS = {
  chronos: [
    { id: 'c1', email: 'admin@northregion.com', status: 'connected' },
  ],
  athena: [
    { id: 'a1', email: 'admin@southregion.com', status: 'connected' },
  ],
};

const EHR_TOOLS = [
  { name: 'Cancel appointment',          description: 'Cancel an existing appointment and free the slot' },
  { name: 'Create appointment',          description: 'Book a new appointment for a patient' },
  { name: 'Fetch waitlist',              description: 'Retrieve the waitlist for a provider or service and find available patients' },
  { name: 'Get form fields',             description: 'Retrieve required intake form fields for a patient or appointment type' },
  { name: 'Get services and specialists', description: 'List available services and providers for scheduling' },
  { name: 'Patient lookup',              description: 'Retrieve patient demographics and record by phone, name, or DOB' },
  { name: 'Reschedule appointment',      description: 'Move an existing appointment to a new slot' },
  { name: 'Verify insurance',            description: 'Check insurance eligibility and coverage details for a patient' },
];

const BRAND_TOOLS = {
  chronos: EHR_TOOLS.map((t, i) => ({ id: `chr-${i + 1}`, ...t })),
  athena:  EHR_TOOLS.map((t, i) => ({ id: `ath-${i + 1}`, ...t })),
};

/* ─── Config drawers for brand tools that need paramList setup ─── */
const BRAND_TOOL_CONFIGS = {
  'Patient lookup': {
    id: 'patient-lookup',
    name: 'Patient lookup',
    icon: 'person_search',
    fields: [{
      id: 'pl-params',
      type: 'paramList',
      params: [
        { id: 'pl-phone',           identifier: 'phone',           dataType: 'String', required: true,  valueType: 'llm',      llmDescription: 'Phone number given by the caller.' },
        { id: 'pl-business_number', identifier: 'business_number', dataType: 'String', required: true,  valueType: 'dynamic',  variableName: 'business_number' },
        { id: 'pl-country_code',    identifier: 'country_code',    dataType: 'String', required: false, valueType: 'constant', constantValue: 'US' },
        { id: 'pl-emailId',         identifier: 'emailId',         dataType: 'String', required: false, valueType: 'llm',      llmDescription: 'Email ID of the patient.' },
        { id: 'pl-patientDob',      identifier: 'patientDob',      dataType: 'String', required: true,  valueType: 'llm',      llmDescription: 'DOB of the patient.' },
      ],
    }],
  },
  'Get services and specialists': {
    id: 'get-services-specialists',
    name: 'Get services and specialists',
    icon: 'medical_services',
    fields: [{
      id: 'gss-params',
      type: 'paramList',
      params: [
        { id: 'gss-business_number', identifier: 'business_number', dataType: 'String', required: true, valueType: 'dynamic', variableName: 'business_number' },
      ],
    }],
  },
  'Verify insurance': {
    id: 'verify-insurance',
    name: 'Verify insurance',
    icon: 'verified_user',
    fields: [{
      id: 'vi-params',
      type: 'paramList',
      params: [
        { id: 'vi-business_number',          identifier: 'business_number',          dataType: 'String', required: true,  valueType: 'dynamic', variableName: 'business_number' },
        { id: 'vi-patientId',                identifier: 'patientId',                dataType: 'String', required: false, valueType: 'llm',     llmDescription: 'Patient identifier — externalId from patient lookup. If unavailable, send phone instead and leave patientId empty.' },
        { id: 'vi-phone',                    identifier: 'phone',                    dataType: 'String', required: false, valueType: 'llm',     llmDescription: 'Phone number of the patient. Send at least one of patientId or phone.' },
        { id: 'vi-payerName',                identifier: 'payerName',                dataType: 'String', required: true,  valueType: 'llm',     llmDescription: 'Payer name from the insurance card. Caller must provide.' },
        { id: 'vi-memberId',                 identifier: 'memberId',                 dataType: 'String', required: true,  valueType: 'llm',     llmDescription: 'Member ID from the insurance card. Caller must provide.' },
        { id: 'vi-policyHolderFirstName',    identifier: 'policyHolderFirstName',    dataType: 'String', required: true,  valueType: 'llm',     llmDescription: 'First name of the policy holder. Reuse caller details if they are the policy holder.' },
        { id: 'vi-policyHolderLastName',     identifier: 'policyHolderLastName',     dataType: 'String', required: false, valueType: 'llm',     llmDescription: 'Last name of the policy holder. Reuse caller details if available.' },
        { id: 'vi-policyHolderDob',          identifier: 'policyHolderDob',          dataType: 'String', required: true,  valueType: 'llm',     llmDescription: 'Policy holder date of birth. Format: MM/dd/yyyy.' },
        { id: 'vi-policyHolderSex',          identifier: 'policyHolderSex',          dataType: 'String', required: true,  valueType: 'llm',     llmDescription: 'Gender/sex of the policy holder. Allowed values: M, F.' },
        { id: 'vi-policyHolderAddress1',     identifier: 'policyHolderAddress1',     dataType: 'String', required: false, valueType: 'llm',     llmDescription: 'Address of the policy holder.' },
        { id: 'vi-insurancePolicyHolderZip', identifier: 'insurancePolicyHolderZip', dataType: 'String', required: false, valueType: 'llm',     llmDescription: 'ZIP code of the policy holder\'s address. Skip if not available.' },
      ],
    }],
  },
  'Fetch waitlist': {
    id: 'fetch-waitlist-hc',
    name: 'Fetch waitlist',
    icon: 'list_alt',
    fields: [
      { id: 'fwl-batch',      type: 'number',   label: 'Waitlist outbound batch', placeholder: 'No. of patients' },
      { id: 'fwl-provider',   type: 'radio',    label: 'If no preferred provider, offer slots of', options: ['Last seen / scheduled provider', 'Any provider (matching appointment type)'], defaultValue: 'Last seen / scheduled provider' },
      { id: 'fwl-ai',         type: 'checkbox', label: 'AI consideration',    showInfoIcon: true, options: ['Best day to send', 'Best time to send'], defaultValue: [] },
      { id: 'fwl-additional', type: 'checkbox', label: 'Additional config',   showInfoIcon: true, options: ['Do not carry over unfilled slots to the next working day.'], defaultValue: [] },
    ],
  },
  'Get form fields': {
    id: 'get-form-fields',
    name: 'Get form fields',
    icon: 'dynamic_form',
    fields: [{
      id: 'gff-params',
      type: 'paramList',
      params: [
        { id: 'gff-business_number', identifier: 'business_number', dataType: 'String', required: true,  valueType: 'dynamic', variableName: 'business_number' },
        { id: 'gff-booking_type',    identifier: 'booking_type',    dataType: 'String', required: false, valueType: 'llm',     llmDescription: 'Who the appointment is for. Allowed values: self, other. Use self if booking for the caller, other if booking for someone else. Default: omit or pass self for caller-self bookings.' },
      ],
    }],
  },
  'Cancel appointment': {
    id: 'cancel-appointment',
    name: 'Cancel appointment',
    icon: 'event_busy',
    fields: [{
      id: 'canc-params',
      type: 'paramList',
      params: [
        { id: 'canc-appointment_id', identifier: 'appointment_id', dataType: 'String', required: true, valueType: 'llm', llmDescription: 'Alphanumeric appointmentId from lookup_patient (e.g. B7GY563rGe). Do not use numeric IDs.' },
      ],
    }],
  },
  'Reschedule appointment': {
    id: 'reschedule-appointment',
    name: 'Reschedule appointment',
    icon: 'event_repeat',
    fields: [{
      id: 'ra-params',
      type: 'paramList',
      params: [
        { id: 'ra-appointment_id',  identifier: 'appointment_id',  dataType: 'String', required: true, valueType: 'llm',     llmDescription: 'appointmentId string from lookup_patient for the appointment to reschedule. Alphanumeric, never numeric.' },
        { id: 'ra-business_number', identifier: 'business_number', dataType: 'String', required: true, valueType: 'dynamic', variableName: 'business_number' },
        { id: 'ra-service_id',      identifier: 'service_id',      dataType: 'Number', required: true, valueType: 'llm',     llmDescription: 'serviceId from lookup_patient for the appointment being rescheduled.' },
        { id: 'ra-specialist_id',   identifier: 'specialist_id',   dataType: 'Number', required: true, valueType: 'llm',     llmDescription: 'specialistId from lookup_patient for the appointment being rescheduled.' },
        { id: 'ra-start_time',      identifier: 'start_time',      dataType: 'String', required: true, valueType: 'llm',     llmDescription: 'Exact time value from the chosen slot in get_available_slots. ISO 8601 with timezone offset. Pass as-is.' },
        { id: 'ra-slot_id',         identifier: 'slot_id',         dataType: 'String', required: true, valueType: 'llm',     llmDescription: 'Exact slotId value from the chosen slot in get_available_slots. Pass as-is.' },
      ],
    }],
  },
  'Create appointment': {
    id: 'create-appointment',
    name: 'Create appointment',
    icon: 'calendar_add_on',
    fields: [{
      id: 'ca-params',
      type: 'paramList',
      params: [
        { id: 'ca-business_number', identifier: 'business_number',        dataType: 'String',  required: true, valueType: 'dynamic', variableName: 'business_number' },
        { id: 'ca-service_id',      identifier: 'service_id',             dataType: 'Number',  required: true, valueType: 'llm',     llmDescription: 'serviceId from get_services_and_specialists.' },
        { id: 'ca-specialist_id',   identifier: 'specialist_id',          dataType: 'Number',  required: true, valueType: 'llm',     llmDescription: 'specialistId from get_services_and_specialists.' },
        { id: 'ca-start_time',      identifier: 'start_time',             dataType: 'String',  required: true, valueType: 'llm',     llmDescription: 'Exact time value from the chosen slot in get_available_slots. ISO 8601 with timezone offset. Pass as-is.' },
        { id: 'ca-slot_id',         identifier: 'slot_id',                dataType: 'String',  required: true, valueType: 'llm',     llmDescription: 'Exact slotId value from the chosen slot in get_available_slots. Pass as-is.' },
        { id: 'ca-form_details',              identifier: 'form_details',              dataType: 'Object',  required: true, valueType: 'llm', llmDescription: 'Patient booking form. Collect fields from get_form_fields before calling. Contains selfBooking + formFieldValues[].' },
        { id: 'ca-form_details_selfBooking',  identifier: 'form_details → selfBooking', dataType: 'Boolean', required: true, valueType: 'llm', llmDescription: 'true if the caller is booking for themselves, false if booking for a dependent.' },
        { id: 'ca-formFieldValues',           identifier: 'form_details → formFieldValues[]', dataType: 'Array', required: true, valueType: 'llm', llmDescription: 'Form fields collected from caller. Each entry is {label, value}. Value formats: phone → (NXX) NXX-XXXX; date → MM-DD-YYYY; gender → Male, Female, or Others; multi-select → semicolon-delimited (e.g. Headache;Cough); name & email → plain text.' },
        { id: 'ca-fv-label',                  identifier: 'formFieldValues → label',   dataType: 'String',  required: true, valueType: 'llm', llmDescription: 'Label exactly as returned by get_form_fields (e.g. Contact First name, Contact Phone number, Contact Date of birth).' },
        { id: 'ca-fv-value',                  identifier: 'formFieldValues → value',   dataType: 'String',  required: true, valueType: 'llm', llmDescription: 'Value collected from caller. Follows format rules per label (see formFieldValues above).' },
        { id: 'ca-newPatient',                identifier: 'newPatient',                dataType: 'Boolean', required: true, valueType: 'llm', llmDescription: 'true if caller is a new patient (appointmentsPresent: false from lookup_patient). false if existing patient.' },
      ],
    }],
  },
};

/* ─── Entity options (Birdeye nav entities) ─── */
const ENTITY_OPTIONS = [
  { id: 'conversation', label: 'Conversation' },
  { id: 'search',       label: 'Search AI' },
  { id: 'listings',     label: 'Listings AI' },
  { id: 'reviews',      label: 'Reviews AI' },
  { id: 'social',       label: 'Social AI' },
  { id: 'referral',     label: 'Referral' },
  { id: 'marketing',    label: 'Marketing Automation AI' },
  { id: 'inbox',        label: 'Inbox' },
  { id: 'frontdesk',    label: 'Front desk' },
  { id: 'surveys',      label: 'Surveys AI' },
  { id: 'ticketing',    label: 'Ticketing' },
  { id: 'insights',     label: 'Insights AI' },
];

/* ─── Drawer shell ─── */
function NativeDrawer({ isOpen, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }} />
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ─── Tool row (internal / brand) ─── */
function ToolRow({ icon, iconDataUrl, name, description, onClick }) {
  return (
    <button type="button" className={styles.toolRow} onClick={onClick}>
      <div className={styles.toolIcon}>
        {iconDataUrl ? (
          <img src={iconDataUrl} alt={name} className={styles.toolIconImg} />
        ) : icon ? (
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#555', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>{icon}</span>
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#555', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>build</span>
        )}
      </div>
      <div className={styles.toolInfo}>
        <span className={styles.toolName}>{name}</span>
        <span className={styles.toolDesc}>{description}</span>
      </div>
    </button>
  );
}

/* ─── Main component ─── */
export default function AddToolDrawer({ isOpen, onClose, onSelectTool, product, activeNavId }) {
  const [tab, setTab]               = useState('internal');
  const [search, setSearch]         = useState('');
  const [internalTools, setInternalTools] = useState([]);
  const [view, setView]             = useState('list');       // 'list' | 'account' | 'brand-tools'
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [toolSearch, setToolSearch] = useState('');
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [entityFilter, setEntityFilter] = useState('All tools');
  const [entityDropdownOpen, setEntityDropdownOpen] = useState(false);
  const [toolConfigTool, setToolConfigTool] = useState(null);
  const [transferToolOpen, setTransferToolOpen] = useState(false);
  const [activeToolDrawerId, setActiveToolDrawerId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setView('list');
      setSearch('');
      setTab('internal');
      setSelectedIntegration(null);
      setSelectedAccount(null);
      setAccountSearch('');
      setToolSearch('');
      setEntityFilter('All tools');
      setEntityDropdownOpen(false);
      return;
    }
    const matchedEntity = ENTITY_OPTIONS.find(e => e.id === activeNavId);
    if (matchedEntity) setEntityFilter(matchedEntity.label);
    const seedTools = getSeedTools().filter(t => !t.hideFromInternalPicker);
    const unsub = subscribeToCustomTools(custom => {
      setInternalTools([...seedTools, ...custom.filter(t => !t.hideFromInternalPicker)]);
    });
    setInternalTools(seedTools);
    return unsub;
  }, [isOpen]);

  function handleSelectIntegration(integration) {
    if (!integration.connected) return;
    setSelectedIntegration(integration);
    setSelectedAccount(null);
    setAccountSearch('');
    setView('account');
  }

  function handleSelectAccount(account) {
    if (account.status === 'expired') return;
    setSelectedAccount(account);
    setToolSearch('');
    setView('brand-tools');
    setAccountDropdownOpen(false);
  }

  function handleSelectTool(tool) {
    const config = BRAND_TOOL_CONFIGS[tool.name];
    if (config) {
      setToolConfigTool({ ...config, integrationId: selectedIntegration?.id, accountId: selectedAccount?.id });
      return;
    }
    onSelectTool?.({ ...tool, integrationId: selectedIntegration?.id, accountId: selectedAccount?.id });
    onClose?.();
  }

  function handleSelectInternalTool(tool) {
    if (tool.id === 'transfer') {
      setTransferToolOpen(true);
      return;
    }
    if (TOOL_DRAWER_MAP[tool.id]) {
      setActiveToolDrawerId(tool.id);
      return;
    }
    if (tool.fields?.length) {
      setToolConfigTool(tool);
    } else {
      onSelectTool?.(tool);
      onClose?.();
    }
  }

  const backToList = () => { setView('list'); setSelectedIntegration(null); setSelectedAccount(null); };
  const backToAccount = () => { setView('account'); setSelectedAccount(null); };

  const accounts = selectedIntegration ? (MOCK_ACCOUNTS[selectedIntegration.id] || []) : [];
  const brandTools = selectedIntegration ? (BRAND_TOOLS[selectedIntegration.id] || []) : [];

  const productFilteredTools = internalTools.filter(t =>
    !product || !t.products || t.products.includes(product)
  );

  // Build module filter options from tools' `modules` field (L1 nav labels)
  const availableModules = new Set(productFilteredTools.flatMap(t => t.modules || []));
  const moduleCategories = [
    'All tools',
    ...ENTITY_OPTIONS.map(e => e.label).filter(label => availableModules.has(label)).sort(),
  ];

  const filteredInternal = productFilteredTools.filter(t => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    const matchesModule = entityFilter === 'All tools' || (t.modules || []).includes(entityFilter);
    return matchesSearch && matchesModule;
  }).sort((a, b) => a.name.localeCompare(b.name));
  const filteredExternal = EXTERNAL_INTEGRATIONS.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAccounts = accounts.filter(a =>
    !accountSearch || a.email.toLowerCase().includes(accountSearch.toLowerCase())
  );
  const filteredBrandTools = brandTools.filter(t =>
    !toolSearch || t.name.toLowerCase().includes(toolSearch.toLowerCase())
  );

  /* ── Back arrow ── */
  const BackArrow = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5.99 10.627L8.733 13.37c.124.124.185.27.184.536s-.062.617-.184.748c-.13.13-.278.196-.446.2-.168.005-.317-.058-.446-.188L3.109 10.53C2.958 10.378 2.883 10.203 2.883 10c0-.202.075-.378.226-.529L6.84 5.742c.124-.124.271-.185.441-.184.17.002.32.068.449.197.12.129.183.275.188.439.004.163-.059.31-.188.44L5.99 9.377H15.793c.178 0 .326.06.446.179.12.12.179.268.179.446s-.06.326-.179.446c-.12.12-.268.179-.446.179H5.99z" fill="currentColor"/>
    </svg>
  );

  /* ── Account selection view ── */
  if (view === 'account') {
    return (
      <NativeDrawer isOpen={isOpen} onClose={onClose}>
        <div className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={backToList}><BackArrow /></button>
          {LOGOS[selectedIntegration?.id] && (
            <img src={LOGOS[selectedIntegration.id]} alt={selectedIntegration.name} style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain' }} />
          )}
          <span className={styles.headerTitle}>{selectedIntegration?.name}</span>
        </div>
        <div className={styles.body}>
          <div className={styles.accountSection}>
            <div className={styles.accountLabel}>Select account <span className={styles.required}>*</span></div>
            <div className={styles.accountSubLabel}>Choose the connected {selectedIntegration?.name} account to use for this tool</div>

            {/* Collapsed select trigger */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.accountSelectTrigger}
                onClick={() => setAccountDropdownOpen(v => !v)}
              >
                <span className={selectedAccount ? styles.accountSelectValue : styles.accountSelectPlaceholder}>
                  {selectedAccount?.email || 'Select'}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#616161', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
                  {accountDropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Expanded dropdown */}
              {accountDropdownOpen && (
                <div className={styles.accountDropdownPanel}>
                  <div className={styles.accountBoxHeader}>
                    <span className={styles.accountBoxLabel}>Select account</span>
                    <button type="button" className={styles.addAccountBtn}>Add new account</button>
                  </div>
                  <div className={styles.accountSearch}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#9e9e9e', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>search</span>
                    <input
                      className={styles.accountSearchInput}
                      placeholder="Search"
                      value={accountSearch}
                      onChange={e => setAccountSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className={styles.accountList}>
                    {filteredAccounts.map(account => (
                      <button
                        key={account.id}
                        type="button"
                        className={`${styles.accountRow} ${selectedAccount?.id === account.id ? styles.accountRowSelected : ''} ${account.status === 'expired' ? styles.accountRowExpired : ''}`}
                        onClick={() => { handleSelectAccount(account); setAccountDropdownOpen(false); }}
                        disabled={account.status === 'expired'}
                      >
                        <span className={`${styles.statusDot} ${account.status === 'expired' ? styles.statusDotRed : styles.statusDotGreen}`} />
                        <div className={styles.accountInfo}>
                          <span className={styles.accountEmail}>{account.email}</span>
                          {account.status === 'expired' ? (
                            <span className={styles.accountError}>{account.error}</span>
                          ) : (
                            <span className={styles.accountStatus}>Connected</span>
                          )}
                        </div>
                        {account.status === 'expired' ? (
                          <button type="button" className={styles.reconnectBtn} onClick={e => e.stopPropagation()}>Reconnect</button>
                        ) : selectedAccount?.id === account.id ? (
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#1976d2', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>check</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </NativeDrawer>
    );
  }

  /* ── Tool config view (inline, no second overlay) ── */
  if (toolConfigTool) {
    return (
      <NativeDrawer isOpen={isOpen} onClose={onClose}>
        <ToolViewerContent
          tool={toolConfigTool}
          clearDefaults
          onClose={() => setToolConfigTool(null)}
          onSave={(tool, fieldValues) => {
            onSelectTool?.({ ...tool, fieldValues });
            setToolConfigTool(null);
            onClose?.();
          }}
        />
      </NativeDrawer>
    );
  }

  /* ── Brand tools view ── */
  if (view === 'brand-tools') {
    return (
      <NativeDrawer isOpen={isOpen} onClose={onClose}>
        <div className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={backToAccount}><BackArrow /></button>
          {LOGOS[selectedIntegration?.id] && (
            <img src={LOGOS[selectedIntegration.id]} alt={selectedIntegration.name} style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain' }} />
          )}
          <span className={styles.headerTitle}>{selectedIntegration?.name}</span>
        </div>
        <div className={styles.body}>
          <div className={styles.accountSection}>
            <div className={styles.accountLabel}>Select account <span className={styles.required}>*</span></div>
            <div className={styles.accountSubLabel}>Choose the connected {selectedIntegration?.name} account to use for this tool</div>
            <div className={styles.selectedAccountRow}>
              <span className={styles.selectedAccountEmail}>{selectedAccount?.email}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" className={styles.accountClearBtn} onClick={backToAccount}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>close</span>
                </button>
                <button type="button" className={styles.accountClearBtn} onClick={backToAccount}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>expand_more</span>
                </button>
              </div>
            </div>
          </div>

          <div className={styles.searchWrap}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#9e9e9e', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>search</span>
            <input
              className={styles.searchInput}
              placeholder="Search tools"
              value={toolSearch}
              onChange={e => setToolSearch(e.target.value)}
            />
          </div>

          <div className={styles.toolList}>
            {filteredBrandTools.map(tool => (
              <ToolRow
                key={tool.id}
                name={tool.name}
                description={tool.description}
                iconDataUrl={LOGOS[selectedIntegration?.id]}
                onClick={() => handleSelectTool(tool)}
              />
            ))}
          </div>
        </div>
      </NativeDrawer>
    );
  }

  /* ── Transfer tool config view (inline, no second overlay) ── */
  if (transferToolOpen) {
    return (
      <NativeDrawer isOpen={isOpen} onClose={onClose}>
        <TransferToolContent
          onClose={() => setTransferToolOpen(false)}
          onSave={(config) => {
            onSelectTool?.({ id: 'transfer', name: 'Transfer', ...config });
            setTransferToolOpen(false);
            onClose?.();
          }}
        />
      </NativeDrawer>
    );
  }

  /* ── Named tool drawer view (AutoFollowUp, EscalationNotifier, etc.) ── */
  if (activeToolDrawerId && TOOL_DRAWER_MAP[activeToolDrawerId]) {
    const ToolDrawerComponent = TOOL_DRAWER_MAP[activeToolDrawerId];
    const toolMeta = internalTools.find(t => t.id === activeToolDrawerId);
    return (
      <NativeDrawer isOpen={isOpen} onClose={onClose}>
        <ToolDrawerComponent
          title={toolMeta?.name}
          onBack={() => setActiveToolDrawerId(null)}
          onSave={() => {
            onSelectTool?.({ id: activeToolDrawerId });
            setActiveToolDrawerId(null);
            onClose?.();
          }}
        />
      </NativeDrawer>
    );
  }

  /* ── Main list view ── */
  return (
    <>
    <NativeDrawer isOpen={isOpen} onClose={onClose}>
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={onClose}><BackArrow /></button>
        <span className={styles.headerTitle}>Add a tool</span>
      </div>

      <div className={styles.body}>
        <div className={styles.searchWrap}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#9e9e9e', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>search</span>
          <input
            className={styles.searchInput}
            placeholder="Search tools"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.tabRow}>
          <div className={styles.tabs}>
            <button type="button" className={`${styles.tab} ${tab === 'internal' ? styles.tabActive : ''}`} onClick={() => setTab('internal')}>Internal tools</button>
            <button type="button" className={`${styles.tab} ${tab === 'external' ? styles.tabActive : ''}`} onClick={() => setTab('external')}>External tools</button>
          </div>
          <button type="button" className={styles.addCustomBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>add_circle</span>
            Add custom integration
          </button>
        </div>

        {tab === 'internal' && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={styles.entityFilterBtn}
              onClick={() => setEntityDropdownOpen(v => !v)}
            >
              <span className={styles.entityFilterLabel}>{entityFilter}</span>
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>expand_more</span>
            </button>
            {entityDropdownOpen && (
              <div className={styles.entityDropdown}>
                {moduleCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`${styles.entityDropdownItem} ${entityFilter === cat ? styles.entityDropdownItemActive : ''}`}
                    onClick={() => { setEntityFilter(cat); setEntityDropdownOpen(false); }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'internal' ? (
          <div className={styles.toolList}>
            {filteredInternal.map(tool => (
              <ToolRow
                key={tool.id}
                icon={tool.icon}
                iconDataUrl={tool.iconDataUrl}
                name={tool.name}
                description={tool.description}
                onClick={() => handleSelectInternalTool(tool)}
              />
            ))}
            {filteredInternal.length === 0 && (
              <div className={styles.empty}>No tools found</div>
            )}
          </div>
        ) : (
          <div className={styles.toolList}>
            {filteredExternal.map(integration => (
              <button
                key={integration.id}
                type="button"
                className={`${styles.toolRow} ${!integration.connected ? styles.toolRowDisabled : ''}`}
                onClick={() => handleSelectIntegration(integration)}
              >
                <div className={styles.toolIcon} style={{ background: 'none', padding: 0 }}>
                  {LOGOS[integration.id] ? (
                    <img src={LOGOS[integration.id]} alt={integration.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'contain', display: 'block' }} />
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#555', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>integration_instructions</span>
                  )}
                </div>
                <div className={styles.toolInfo}>
                  <span className={styles.toolName}>{integration.name}</span>
                  <span className={styles.toolDesc}>{integration.description}</span>
                </div>
                {integration.connected ? (
                  <div className={styles.connectedBadge}>
                    <span className={styles.statusDotGreen} style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
                    <span className={styles.connectedText}>Connected</span>
                  </div>
                ) : (
                  <span className={styles.connectBtn}>Connect</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </NativeDrawer>
    </>
  );
}

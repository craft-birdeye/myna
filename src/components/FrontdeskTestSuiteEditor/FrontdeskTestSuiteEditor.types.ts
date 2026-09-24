import type { FrontdeskTestSuite } from '../../data/frontdeskTestSessions'

export interface FrontdeskTestSuiteEditorProps {
  existingSuite?: FrontdeskTestSuite | null
  onBack: () => void
  onSave: (suite: FrontdeskTestSuite) => void
}

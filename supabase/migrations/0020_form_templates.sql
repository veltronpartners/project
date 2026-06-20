-- Standard form templates (Spec Section 10.6). Representative subset of
-- each form's fields rather than every single line item — staff can
-- duplicate and extend per partner via the Form Builder.

insert into forms (title, description, form_type, status, is_template, schema) values
(
  'Company Onboarding Questionnaire',
  'Sent immediately on approval — company identity, founders, legal, financials, operations, and engagement preferences.',
  'onboarding',
  'active',
  true,
  '{"sections":[
    {"id":"identity","title":"Company Identity","fields":[
      {"id":"legal_name","type":"short_text","label":"Full legal name","required":true},
      {"id":"trading_name","type":"short_text","label":"Trading name (if different)"},
      {"id":"reg_number","type":"short_text","label":"Company registration number","required":true},
      {"id":"country","type":"short_text","label":"Country of incorporation","required":true},
      {"id":"founded_date","type":"date","label":"Date of incorporation"},
      {"id":"address","type":"long_text","label":"Physical / registered address"},
      {"id":"website","type":"short_text","label":"Company website"},
      {"id":"description","type":"long_text","label":"Brief description of what the company does (max 500 words)","required":true},
      {"id":"problem_solved","type":"long_text","label":"What problem does your company solve? (max 300 words)","required":true}
    ]},
    {"id":"founders","title":"Founders & Key Stakeholders","fields":[
      {"id":"founder_1_name","type":"short_text","label":"Founder 1 — full name"},
      {"id":"founder_1_role","type":"short_text","label":"Founder 1 — role / title"},
      {"id":"founder_1_email","type":"short_text","label":"Founder 1 — email"},
      {"id":"founder_1_equity","type":"number","label":"Founder 1 — equity percentage held"},
      {"id":"silent_partners","type":"yes_no","label":"Are there silent partners or holding company structures?"},
      {"id":"board_members","type":"yes_no","label":"Are there any board members not listed above?"}
    ]},
    {"id":"legal","title":"Legal & Compliance","fields":[
      {"id":"entity_type","type":"dropdown","label":"Entity type","options":["Limited Company","LLC","Sole Proprietor","Partnership","NGO","Other"],"required":true},
      {"id":"incorporation_cert","type":"file_upload","label":"Upload: Certificate of Incorporation","required":true},
      {"id":"articles","type":"file_upload","label":"Upload: Memorandum & Articles of Association"},
      {"id":"legal_disputes","type":"yes_no","label":"Any active legal disputes involving the company?","required":true},
      {"id":"debts_sanctions","type":"yes_no","label":"Any outstanding debts, judgements, or regulatory sanctions?","required":true},
      {"id":"staff_connection","type":"yes_no","label":"Does any Veltron Partners staff member have a personal/financial connection to your company?"},
      {"id":"declaration","type":"signature","label":"I confirm all information provided is accurate and complete to the best of my knowledge","required":true}
    ]},
    {"id":"financials","title":"Financial Snapshot","fields":[
      {"id":"revenue_stage","type":"dropdown","label":"Current revenue stage","options":["Pre-Revenue","Early Revenue","Scaling","Profitable"],"required":true},
      {"id":"mrr","type":"number","label":"Monthly Recurring Revenue (if applicable)"},
      {"id":"burn_rate","type":"number","label":"Monthly burn rate (if applicable)"},
      {"id":"funding_received","type":"short_text","label":"Total external funding received to date (amount + sources)"},
      {"id":"financial_statements","type":"file_upload","label":"Upload: Most recent financial statements"},
      {"id":"pitch_deck","type":"file_upload","label":"Upload: Pitch deck or executive summary"}
    ]},
    {"id":"operations","title":"Business Operations","fields":[
      {"id":"team_size_ft","type":"number","label":"Current full-time team size"},
      {"id":"team_size_pt","type":"number","label":"Current part-time / contractor count"},
      {"id":"key_markets","type":"short_text","label":"Key markets currently operating in"},
      {"id":"top_clients","type":"long_text","label":"Top 3 clients or customer segments"}
    ]},
    {"id":"preferences","title":"Engagement Preferences","fields":[
      {"id":"primary_contact","type":"short_text","label":"Primary contact for Veltron (name, role, email, phone)","required":true},
      {"id":"secondary_contact","type":"short_text","label":"Secondary / backup contact"},
      {"id":"comm_channel","type":"dropdown","label":"Preferred communication channel","options":["Email","Portal Messages","WhatsApp"]},
      {"id":"meeting_format","type":"dropdown","label":"Preferred meeting format","options":["Video Call","In Person","Either"]},
      {"id":"notes","type":"long_text","label":"Additional notes or anything you''d like Veltron to know"}
    ]}
  ]}'
),
(
  'Periodic Progress Report',
  'Sent on agreed cadence (weekly / biweekly / monthly).',
  'periodic_report',
  'active',
  true,
  '{"sections":[
    {"id":"progress","title":"Progress Update","fields":[
      {"id":"overall_progress","type":"dropdown","label":"Overall progress this period","options":["On Track","Slightly Behind","At Risk","Ahead of Plan"],"required":true},
      {"id":"wins","type":"long_text","label":"Key wins / achievements this period"},
      {"id":"challenges","type":"long_text","label":"Key challenges or blockers"},
      {"id":"support_needed","type":"long_text","label":"Support or input needed from Veltron this period"},
      {"id":"priorities_next","type":"long_text","label":"Top 3 priorities for the next reporting period"},
      {"id":"upcoming_events","type":"long_text","label":"Any upcoming events, launches, or milestones to flag?"},
      {"id":"supporting_docs","type":"file_upload","label":"Upload: any supporting documents (optional)"}
    ]}
  ]}'
),
(
  'Document Request Form',
  'Ad hoc — sent when a specific document is needed.',
  'document_request',
  'active',
  true,
  '{"sections":[
    {"id":"request","title":"Document Request","fields":[
      {"id":"document_requested","type":"short_text","label":"Document requested","required":true},
      {"id":"instructions","type":"long_text","label":"Instructions"},
      {"id":"file","type":"file_upload","label":"Upload","required":true},
      {"id":"notes","type":"long_text","label":"Notes from partner (optional)"}
    ]}
  ]}'
),
(
  'Annual Review Questionnaire',
  'Sent once per year.',
  'annual_review',
  'active',
  true,
  '{"sections":[
    {"id":"review","title":"Annual Review","fields":[
      {"id":"rating","type":"rating","label":"How would you rate Veltron''s support over the past year?","required":true},
      {"id":"most_valuable","type":"long_text","label":"What has been the most valuable thing Veltron has done for your company?"},
      {"id":"could_improve","type":"long_text","label":"What could Veltron do better or differently?"},
      {"id":"strategy_changed","type":"yes_no","label":"Has your company''s strategic direction changed since onboarding?"},
      {"id":"new_support_areas","type":"long_text","label":"Are there new areas where you need Veltron''s support?"},
      {"id":"terms_appropriate","type":"yes_no","label":"Are the current engagement terms still appropriate?"},
      {"id":"concerns","type":"long_text","label":"Any concerns about the relationship you''d like to raise?"},
      {"id":"updated_overview","type":"long_text","label":"Updated company overview: team size, revenue stage, key markets"},
      {"id":"updated_deck","type":"file_upload","label":"Upload: Updated pitch deck or company profile (optional)"}
    ]}
  ]}'
),
(
  'Exit / Offboarding Form',
  'Sent when engagement concludes.',
  'exit',
  'active',
  true,
  '{"sections":[
    {"id":"exit","title":"Exit Details","fields":[
      {"id":"end_date","type":"date","label":"Engagement end date","required":true},
      {"id":"exit_reason","type":"dropdown","label":"Reason for exit","options":["Completed Scope","Mutual Agreement","Company Acquired","Other"],"required":true},
      {"id":"final_kpis","type":"long_text","label":"Final KPI values for all agreed metrics"},
      {"id":"key_outcomes","type":"long_text","label":"Key outcomes achieved during the Veltron engagement"},
      {"id":"testimonial_permission","type":"yes_no","label":"Testimonial / reference permission?"},
      {"id":"final_report","type":"file_upload","label":"Upload: Final company report or update (optional)"},
      {"id":"signature","type":"signature","label":"Digital signature confirming engagement close","required":true}
    ]}
  ]}'
);

// Sample resume data (fictional person — all names, contacts and companies are dummy).
// Edit in the app, then use "Export JSON" to keep a copy.
window.SAMPLE_RESUME = {
  version: 1,
  settings: {
    pageSize: 'A4',
    font: 'Inter',
    fontSize: 9.75,
    lineHeight: 1.55,
    marginX: 15,
    marginY: 14,
    accent: '#1c2b45',
    skillsLayout: 'columns'
  },
  basics: {
    name: 'Alex Morgan',
    title: 'Data Analyst',
    location: 'Pune, Maharashtra, India',
    email: 'alex.morgan@example.com',
    phone: '+91 90000 00000',
    links: [
      { text: 'alexmorgan.example.com' },
      { text: 'linkedin.com/in/alex-morgan-example' },
      { text: 'github.com/alexmorgan-example' }
    ]
  },
  sections: [
    {
      type: 'text',
      title: 'Summary',
      text: 'Data Analyst with 4+ years of experience turning raw data into decisions for sales, marketing and operations teams at Acme Retail. Builds SQL data models, Python analyses and Power BI / Tableau dashboards used by 200+ stakeholders, from data cleaning and ETL up to A/B testing and forecasting. Hands-on experience in customer analytics, pricing and supply-chain reporting, taking projects from ad-hoc questions to automated, self-serve reporting.'
    },
    {
      type: 'skills',
      title: 'Skills',
      items: [
        { label: 'Languages', value: 'SQL, Python (Pandas, NumPy, Matplotlib, Seaborn), R, DAX' },
        { label: 'BI / Visualization', value: 'Power BI, Tableau, Looker Studio, Excel (Pivot Tables, Power Query, VLOOKUP/XLOOKUP)' },
        { label: 'Databases / Warehouses', value: 'PostgreSQL, MySQL, SQL Server, BigQuery, Snowflake' },
        { label: 'Data Engineering', value: 'ETL pipelines, dbt, Airflow, Data modeling, Data cleaning, Data validation' },
        { label: 'Statistics / Analytics', value: 'A/B testing, Hypothesis testing, Regression, Forecasting, Cohort & funnel analysis, Segmentation' },
        { label: 'Machine Learning', value: 'scikit-learn, Classification, Clustering, Time-series forecasting' },
        { label: 'Tools', value: 'Git, Jupyter, VS Code, Google Analytics 4, Jira, Confluence' },
        { label: 'Practices', value: 'KPI definition, Stakeholder management, Data storytelling, Documentation' },
        { label: 'Familiar with', value: 'Spark, AWS (S3, Athena)' }
      ]
    },
    {
      type: 'entries',
      kind: 'experience',
      title: 'Professional Experience',
      items: [
        {
          title: 'Data Analyst',
          subtitle: 'Acme Retail Pvt. Ltd.',
          date: 'Jul 2021 – Present',
          note: '',
          bullets: [
            'Own analytics for sales and marketing across 120+ stores, delivering weekly insights to regional heads and the leadership team.',
            'Built 15+ Power BI dashboards on a SQL star-schema model, replacing manual Excel reports and saving 25+ analyst hours per week.',
            'Designed and analysed A/B tests for pricing and promotions, identifying changes that lifted average order value by 8%.',
            'Developed a customer segmentation model (RFM + k-means) in Python that improved campaign conversion rates by 18%.',
            'Automated daily ETL pipelines with dbt and Airflow on BigQuery, cutting data refresh time from 6 hours to 40 minutes.',
            'Launched a demand-forecasting model that reduced stock-outs by 12% across the top 500 SKUs.',
            'Partner with product, finance and operations teams to define KPIs, validate data quality and document metric definitions.'
          ]
        }
      ]
    },
    {
      type: 'entries',
      kind: 'project',
      title: 'Projects',
      items: [
        {
          title: 'Customer Churn Analysis',
          subtitle: 'Python, scikit-learn, SQL',
          date: '',
          note: '',
          bullets: [
            'Analysed 2 years of subscription data to identify churn drivers and built a logistic-regression churn model.',
            'Delivered a retention target list with 81% precision, used by the CRM team for outreach.'
          ]
        },
        {
          title: 'Sales Performance Dashboard',
          subtitle: 'Power BI, DAX, SQL Server',
          date: '',
          note: '',
          bullets: [
            'Designed an interactive dashboard with drill-downs by region, store and category, with row-level security.',
            'Became the single source of truth for weekly sales reviews across 40+ managers.'
          ]
        },
        {
          title: 'Marketing Attribution Model',
          subtitle: 'Google Analytics 4, BigQuery, Python',
          date: '',
          note: '',
          bullets: [
            'Engineered a multi-touch attribution model joining GA4 events with order data in BigQuery.',
            'Shifted 15% of paid-media budget to higher-performing channels based on the findings.'
          ]
        },
        {
          title: 'Supply Chain KPI Tracker',
          subtitle: 'Tableau, Snowflake, dbt',
          date: '',
          note: '',
          bullets: [
            'Modelled inventory, lead-time and fill-rate metrics in dbt and visualised them in Tableau.',
            'Enabled early detection of supplier delays and reduced late deliveries by 10%.'
          ]
        },
        {
          title: 'Public Health Data Exploration',
          subtitle: 'R, ggplot2, Open data',
          date: '',
          note: '',
          bullets: [
            'Cleaned and explored a public health dataset to compare regional trends over 10 years.',
            'Published the analysis and visualisations as a reproducible report on GitHub.'
          ]
        }
      ]
    },
    {
      type: 'entries',
      kind: 'education',
      title: 'Education',
      items: [
        {
          title: 'Bachelor of Science, Statistics',
          subtitle: 'Example University, Pune, Maharashtra',
          date: 'Aug 2018 – Jun 2021',
          note: 'CGPA: 8.5',
          bullets: []
        }
      ]
    },
    {
      type: 'list',
      title: 'Certifications',
      items: [
        'Data Analytics Professional Certificate — Example Online Academy, March 2021',
        'Power BI Data Analyst Associate — Example Certification Board, January 2023'
      ]
    }
  ]
};

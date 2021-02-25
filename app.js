'use strict';

function getTaskAlias () {
  const taskAlias = document.querySelector('#inpDsFlowElementAlias');

  return taskAlias
    ? taskAlias.value
    : null
}

function conditionals (helperClass = 'hidden', context = document) {
  context
    .querySelectorAll('[data-if]')
    .forEach(element => {
      const currentAlias = element.dataset.if
        .replace(/[\s[\]]/g, '') // remove white spaces and brakets
        .split(','); // splits if it's a list, using comma

      if (currentAlias.includes(getTaskAlias())) {
        element.removeAttribute('data-if');
        element.classList.remove(helperClass);
      } else {
        element.classList.add(helperClass);
      }
    });
}

const defaults = {
  container: 'tr',
  hideClass: 'hidden',
  dataAttrRequired: 'data-was-required',
  requiredClass: 'execute-required'
};

/**
 * 💡 Helpers
 */

function getFieldById (fieldId, options) {
  options = {
    returnArray: false,
    ...options
  };

  const fields = document.querySelectorAll(`[xname="inp${fieldId}"]`);

  if (options.returnArray) {
    return [...fields]
  }

  return fields.length > 1
    ? [...fields]
    : fields[0]
}

function clearFileField (field) {
  const id = field.getAttribute('xname').substring(3);
  const deleteBtn = field.parentElement
    .querySelector(`#div${id} > a:last-of-type`);

  if (deleteBtn) {
    deleteBtn.click();
  }
}

function hasFieldRequired (fields) {
  return fields.filter(
    field =>
      field.getAttribute(defaults.dataAttrRequired) ||
      field.getAttribute('required') === 'S'
  ).length > 0
}

/**
 * 🧷 Form Utils
 */

function getField (field, options) {
  options = {
    returnArray: false,
    ...options
  };

  if (field instanceof HTMLElement) {
    return options.returnArray
      ? [field]
      : field
  }

  if (
    field instanceof HTMLCollection ||
    field instanceof NodeList ||
    Array.isArray(field)
  ) {
    return [...field]
  }

  if (typeof field === 'string') {
    return getFieldById(field, options)
  }
}

function clearFieldValues (field) {
  const $fields = getField(field, { returnArray: true });
  const changeEvent = new Event('change');

  $fields.forEach(field => {
    const fieldType = field.type;
    const xType = field.getAttribute('xtype');

    if (['text', 'textarea', 'select-one', 'hidden'].includes(fieldType)) {
      if (xType === 'FILE') {
        clearFileField(field);
      } else {
        field.value = '';
      }
    } else {
      field.checked = false;
    }

    field.dispatchEvent(changeEvent);
  });
}

function showField (field, container = defaults.container) {
  const $fields = getField(field, { returnArray: true });
  const $container = $fields[0].closest(container);
  const isRequired = hasFieldRequired($fields);

  $container.classList.remove(defaults.hideClass);

  if (isRequired) {
    addRequired($fields, true);
  }
}

function hideField (field, container = defaults.container) {
  const $fields = getField(field, { returnArray: true });
  const $container = $fields[0].closest(container);
  const isRequired = hasFieldRequired($fields);

  $container.classList.add(defaults.hideClass);

  clearFieldValues($fields);

  if (isRequired) {
    removeRequired($fields, true);
  }
}

/**
 * 📌 Form Required
 */

function addRequired (field, addClass = false) {
  const $fields = getField(field, { returnArray: true });

  $fields.forEach(field => {
    field.setAttribute('required', 'S');
    field.removeAttribute('data-was-required');
  });

  if (addClass && defaults.container === 'tr') {
    const $container = $fields[0].closest(defaults.container);
    $container.classList.add(defaults.requiredClass);
  }
}

function removeRequired (field, addClass = false) {
  const $fields = getField(field, { returnArray: true });

  $fields.forEach(field => {
    field.setAttribute('required', 'N');
    field.setAttribute('data-was-required', true);
  });

  if (addClass && defaults.container === 'tr') {
    const $container = $fields[0].closest(defaults.container);
    $container.classList.remove(defaults.requiredClass);
  }
}

const defaults$1 = {
  dataAttr: 'data-analysis',
  toggleMode: 'required',
  approveButtons: [
    '#btnFinish',
    '#BtnSend'
  ],
  reproveOptions: []
};

function TableAnalysys (params) {
  params = {
    ...defaults$1,
    ...params
  };

  const approveButtons = [
    ...params.approveButtons
      .map(btnRef => document.querySelector(btnRef))
  ];

  const analysisFields = [
    ...params.table
      .querySelectorAll(`[${params.dataAttr}]`)
  ]
    .filter(cell => cell.querySelector('select[xname^=inpanalise]'))
    .map(cell => cell.querySelector('select[xname^=inpanalise]'));

  const instance = {
    table: params.table,
    reproveOptions: params.reproveOptions,
    toggleMode: params.toggleMode,
    dataAttr: params.dataAttr,
    approveButtons,
    analysisFields
  };

  addTriggers();
  renderTable();

  return instance

  /**
   * 🔒 Private Methods
   */
  function addTriggers () {
    instance.analysisFields.forEach(field => {
      handleAnalysis();
      handleObservation(field);

      field.addEventListener('change', () => {
        handleAnalysis();
        handleObservation(field);
      });
    });
  }

  function renderTable () {
    params.table
      .querySelectorAll(`[${params.dataAttr}]`)
      .forEach(cell => {
        cell.style.display = 'table-cell';

        cell
          .querySelectorAll('input[xname^=inpanalise][type=hidden][xtype=SELECT]')
          .forEach(field => {
            const hasRejection = instance.reproveOptions
              .includes(field.value);

            if (!hasRejection) {
              field
                .closest('tr')
                .querySelector('button')
                .style.display = 'none';
            }
          });
      });
  }

  function hasRejection () {
    return instance.analysisFields
      .some(select => instance.reproveOptions
        .includes(select.value)
      )
  }

  function handleAnalysis () {
    hasRejection()
      ? disabledConclude()
      : enableConclude();
  }

  function disabledConclude () {
    instance.approveButtons.forEach(btn => {
      if (btn) {
        btn.disabled = true;
      }
    });
  }

  function enableConclude () {
    instance.approveButtons.forEach(btn => {
      if (btn) {
        btn.disabled = false;
      }
    });
  }

  function handleObservation (analysis) {
    const observation = analysis.closest('tr')
      .querySelector('textarea');

    const hasObservation = params.reproveOptions
      .includes(analysis.value);

    if (instance.toggleMode === 'required') {
      return hasObservation
        ? addRequired(observation)
        : removeRequired(observation)
    }

    if (instance.toggleMode === 'visibility') {
      return hasObservation
        ? showField(observation, 'td')
        : hideField(observation, 'td')
    }
  }
}

const DATASOURCE_PATH = '/api/internal/legacy/1.0/datasource/get/1.0';

/**
 * SQL - Usuários Fornecedores - Terceiros
 * Cód. 1111 (PRD)
 */
const DATASOURCE_URL = '/qw0Xk6xWKL563BI8VvBqJsZaSnDoqSet@DpxFTueSPjxcAaP4GttCrM6Ey@GVsHaA6JMHyII2gYam9sJuBGwRA__';

const getCompanies = function () {
  return fetch(DATASOURCE_PATH + DATASOURCE_URL)
    .then(res => res.json())
    .then(({ success }) => {
      if (!success) {
        throw new Error('Something went wrong getting companies')
      }

      return formatCompaniesData(success)
    })
    .catch(console.error)
};

const formatCompaniesData = data =>
  data.map(({ cod, txt, fields }) => ({
    codigoUsuario: cod,
    razaoSocial: txt,
    cnpjFornecedor: fields.cnpjFornecedor
  }));

function ComponentError ({ message, name, type }) {
  this.name = name || 'ComponentError';
  this.message = message;
  this.type = type;
  this.stack = (new Error()).stack;

  this.codflowExecute = getElementValueById('inpCodFlowExecute');
  this.codflow = getElementValueById('inpCodFlow');
}

ComponentError.prototype = new Error();

const getElementValueById = id => {
  const $el = document.getElementById(id);

  return $el
    ? $el.value
    : null
};

function ComponentReference (reference, component) {
  // Any QuerySelector string
  // e.g. 'div > .class'
  if (typeof reference === 'string') {
    let elements;

    try {
      elements = [...document.querySelectorAll(reference)];
    } catch (error) {
      throw new ComponentError({
        name: component,
        message:
        'Erro ao inicializar a instância do componente.' +
        `\n${reference} não é um seletor válido`,
        type: 'reference_queryselector_validation'
      })
    }

    if (!elements.length) {
      throw new ComponentError({
        name: component,
        message:
        'Erro ao inicializar a instância do componente.' +
        `\nNão foi encontrado nenhum elemento para o seletor ${reference}`,
        type: 'reference_queryselector_empty'
      })
    }

    return elements
  }

  // Single HTML Elements
  // e.g. document.querySelector('div')
  if (reference instanceof HTMLElement) {
    return reference
  }

  // HTML Collection and Node List
  // HTMLCollection: e.g. document.getElementsByClassName('myClass')
  // NodeList: e.g. document.querySelectorAll('div')
  if (reference instanceof HTMLCollection) {
    return [...reference]
  }

  // Array of HTML Elements
  // e.g. [document.querySelector('#a'), document.querySelector('#b')]
  if (Array.isArray(reference)) {
    if (!reference.length) {
      throw new ComponentError({
        name: component,
        message:
        'Erro ao inicializar a instância do componente.' +
        '\nVocê não pode chamar o construtor com array vazio',
        type: 'reference_array_empty'
      })
    }

    reference.forEach(element => {
      if (!(element instanceof HTMLElement)) {
        throw new ComponentError({
          name: component,
          message:
          'Erro ao inicializar a instância do componente' +
          '\nVocê não pode chamar o construtor com arrays que possuam elementos diferentes de HTMLElement',
          type: 'reference_array_validation'
        })
      }
    });

    return reference
  }

  throw new ComponentError({
    name: component,
    message:
    'Erro ao inicializar a instância do componente.' +
    '\nVocê deve chamar o construtor com strings (seletores CSS), HTMLElement, HTMLElement[], HTMLCollection ou NodeList',
    type: 'reference_invalid_type'
  })
}

function ComponentInstance ({ elements, params, factory }) {
  if (elements instanceof HTMLElement) {
    return factory(elements, params)
  }

  return elements
    .map(element => factory(element, params))
    .filter(element => element !== undefined)
}

const defaults$2 = {
  btnInsertRef: '#btnInsertNewRow',
  btnDeleteRef: '#btnDeletewRow',
  disabledClass: '-disabled',
  readonlyClass: '-readonly'
};

function TableMultiValue (reference, onMount, params) {
  params = {
    ...defaults$2,
    ...params,
    onMount,
    name: 'TableMultiValue'
  };

  const elements = ComponentReference(reference, params.name);

  return ComponentInstance({
    elements,
    params,
    factory: createInstance
  })
}

function createInstance (element, params) {
  const table = getOrquestraTableMv(element, params);
  const btnInsert = table.querySelector(params.btnInsertRef);
  const instance = {
    table,
    btnInsert,
    reset,
    enable,
    disable,
    on,
    getRows,
    getLastRow,
    getLength,
    appendData,
    getData
  };

  if (params.onMount) {
    getRows()
      .forEach(row => params.onMount(row));
  }

  if (!btnInsert) {
    instance.table
      .classList
      .add(params.readonlyClass);
  }

  registerTableEvents();

  table[`_${params.name}`] = instance;

  return instance

  /**
   * 🔒 Private Methods
   */
  function getEventConfig (extend) {
    return {
      detail: {
        table: instance.table,
        length: getLength(),
        lastRow: getLastRow(),
        ...extend
      }
    }
  }

  function registerTableEvents () {
    if (instance.btnInsert) {
      instance.btnInsert
        .removeAttribute('onclick');

      instance.btnInsert
        .removeEventListener('click', InsertNewRow);

      instance.btnInsert
        .addEventListener('click', handleInsert);
    }

    getRows()
      .forEach(registerRowEvents);
  }

  function registerRowEvents (row) {
    const btnDelete = row.querySelector(params.btnDeleteRef);

    if (!btnDelete) {
      return
    }

    btnDelete
      .removeAttribute('onclick');

    btnDelete
      .removeEventListener('click', DeleteRow);

    btnDelete
      .addEventListener('click', handleDelete);
  }

  function handleInsert () {
    instance.table.dispatchEvent(
      new CustomEvent('beforeInsert', getEventConfig())
    );

    InsertNewRow(this, true);

    const newestRow = getLastRow();

    registerRowEvents(newestRow);

    if (params.onMount) {
      params.onMount(newestRow);
    }

    instance.table.dispatchEvent(
      new CustomEvent('afterInsert', getEventConfig())
    );
  }

  function handleDelete () {
    const tableLength = getLength();
    const deletedRow = getLastRow();

    instance.table.dispatchEvent(
      new CustomEvent('beforeDelete', getEventConfig({ deletedRow }))
    );

    DeleteRow(this);

    if (getLength() < tableLength) {
      instance.table.dispatchEvent(
        new CustomEvent('afterDelete', getEventConfig({ deletedRow }))
      );
    }
  }

  /**
   * 🔑 Public Methods
   */
  function reset () {
    instance.btnInsert
      .click();

    instance.table
      .querySelectorAll('tr:not(:first-child):not(:last-child')
      .forEach(row => row.remove());
  }

  function enable () {
    instance.table
      .classList
      .remove(params.disabledClass);
  }

  function disable () {
    instance.table
      .classList
      .add(params.disabledClass);
  }

  function on (event, callback) {
    instance.table
      .addEventListener(event, callback);
  }

  function getRows () {
    return [
      ...instance.table
        .querySelectorAll('tr:not(.header)')
    ]
  }

  function getLastRow () {
    return instance.table
      .querySelector('tr:last-child')
  }

  function getLength () {
    return getRows().length
  }

  function appendData (data, params) {
    const options = {
      keepRows: false,
      ...params
    };

    if (!options.keepRows) {
      reset();
    }

    data.forEach((field, rowIndex) => {
      if (rowIndex > 0 || options.keepRows) {
        instance.btnInsert
          .click();
      }

      Object.entries(field)
        .forEach(([id, value]) => {
          const currentRow = getLastRow();
          const field = currentRow.querySelector(`[xname=inp${id}]`);

          if (field) {
            field.value = value;
          }
        });
    });
  }

  function getData () {
    return getRows()
      .map((row, rowIndex) => {
        const fields = [...row.querySelectorAll('[xname]')];
        let isEmptyRow;

        if (rowIndex === 0) {
          isEmptyRow = fields
            .every(field => field.value === '');
        }

        if (isEmptyRow) {
          return {}
        }

        return fields.reduce((fields, field) => {
          const id = field.getAttribute('xname').substring(3);
          const value = field.value;

          fields[id] = value;

          return fields
        }, {})
      })
      .filter(row => Object.keys(row).length)
  }
}

/**
 * 💡 Helper Functions
 */
function getOrquestraTableMv (element, params) {
  const isTable = element.tagName.toLowerCase() === 'table';
  const isTableMv = element.getAttribute('mult') === 'S';

  if (!isTable) {
    throw new ComponentError({
      name: params.name,
      message:
      'Erro ao criar a instância do componente.\nNenhuma tabela encontrada para a referência informada',
      type: 'instace_table_not_found'
    })
  }

  if (!isTableMv) {
    throw new ComponentError({
      name: params.name,
      message:
      'Erro ao criar a instância do componente.\nNenhuma tabela multi-valorada encontrada para a referência informada',
      type: 'instace_table_mv_not_found'
    })
  }

  return element
}

const Companies = function () {
  const $refs = {
    table: document.querySelector('#tbl-companies'),
    period: document.querySelector('[xname=inpperiodoVigencia]')
  };

  const state = {
    alias: null,
    CompaniesTable: null,
    mountOn: [
      'selecao-terceiros'
    ]
  };

  return {
    init
  }

  /**
   * 🔑 Public Methods
   */
  function init ({ alias }) {
    const hasToMount = state.mountOn
      .includes(alias);

    state.alias = alias;

    if (hasToMount) {
      mount();
    }
  }

  /**
   * 🔒 Private Methods
   */
  function mount () {
    mountMonthPicker();
    mountTable();
  }

  function mountMonthPicker () {
    flatpickr($refs.period, {
      locale: 'pt',
      plugins: [
        /* eslint-disable new-cap */
        new monthSelectPlugin({
          dateFormat: 'F/Y'
        })
      ]
    });
  }

  async function mountTable () {
    const companies = await getCompanies();

    state.CompaniesTable = TableMultiValue($refs.table);
    state.CompaniesTable.btnInsert.style.display = 'none';
    state.CompaniesTable.appendData(companies);
  }
};

var Companies$1 = Companies();

const currencyFormatter = new Intl.NumberFormat(
  'pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

function cnpj (value) {
  return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d)/, '$1.$2.$3/$4-$5')
}

function titleCase (value) {
  return value
    .toLowerCase()
    .split(' ')
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1)
    }).join(' ')
}

function firstWord (value) {
  return value.split(' ')[0]
}

function empty (value) {
  if (value === null || value === '') {
    return '-'
  }
  return value
}

function hour (value) {
  if (value === null || value === '') {
    return '-'
  }

  return isNaN(value)
    ? value
    : `${value}h`
}

function currency (number) {
  const num = parseFloat(number) || 0;

  if (num === 0) {
    return '-'
  }

  return currencyFormatter.format(
    parseFloat(number) || 0
  )
}

var DefaultFilters = {
  cnpj,
  titleCase,
  firstWord,
  empty,
  hour,
  currency
};

const defaults$3 = {
  ref: '[data-bind]',
  filterRef: '[data-filter]',
  filters: DefaultFilters
};

const SUPPORTED_TYPE_FIELDS = [
  'text',
  'textarea',
  'select-one',
  'hidden',
  'radio'
];

function Binder (params) {
  const config = params = {
    ...defaults$3,
    ...params,
    name: 'Binder'
  };

  const CustomFilters = params.filters || {};

  config.filters = {
    ...DefaultFilters,
    ...CustomFilters
  };

  const elements = document.querySelectorAll(config.ref);

  const instance = {
    elements,
    update,
    updateAll
  };

  elements.forEach(mount);

  return instance

  /**
   * 🔒 Private Methods
   */
  function mount (element) {
    const { id, filter, fields } = getRefs(element);

    if (!fields.length) {
      throw new ComponentError({
        name: config.name,
        message:
        `Erro ao montar componente.\nNenhum campo do Orquestra encontrado para a referência ${id}`,
        type: 'field_not_found'
      })
    }

    const mask = fields[0].getAttribute('mask');
    const events = mask !== ''
      ? 'blur change keyup keydown'
      : 'change keyup';

    // Attention: using jQuery to react for changes in `sugestão` and `data`
    // (bootstrap-datepicker) Orquestra fields.
    // Those fields don't trigger native `change` events. 😞

    fields.forEach(field => {
      const isSupported = SUPPORTED_TYPE_FIELDS
        .includes(field.type);

      if (!isSupported) {
        return
      }

      setValue({ element, field, filter });

      $(field).on(events, () => {
        setValue({ element, field, filter });
      });
    });
  }

  function getRefs (element) {
    const id = element.getAttribute(
      stripeRefName(config.ref)
    );

    const filter = element.getAttribute(
      stripeRefName(config.filterRef)
    );

    const fields = document.querySelectorAll(`[xname=inp${id}]`);

    return {
      id,
      filter,
      fields
    }
  }

  function setValue ({ element, field, filter }) {
    const type = field.type;
    const hasFilter = filter && config.filters[filter];

    if (type === 'radio' && !field.checked) {
      return
    }

    const value = hasFilter
      ? config.filters[filter](field.value)
      : field.value;

    element.innerHTML = value;
  }

  /**
   * 🔑 Public Methods
   */
  function update (element) {
    const { filter, fields } = getRefs(element);

    if (!fields) {
      return
    }

    setValue({ element, fields, filter });
  }

  function updateAll () {
    instance.elements
      .forEach(element => {
        const { filter, field } = getRefs(element);
        setValue({ element, field, filter });
      });
  }
}

const stripeRefName = propSelector =>
  propSelector.substring(1, propSelector.length - 1);

const alias = getTaskAlias();

conditionals();
Binder();

Companies$1.init({ alias });

/**
 * Orquestra @fix
 * Corrige o erro ao remover um arquivo de um campo do tipo `Arquivo`
 */
window.isInsideMultipleValueTable = btn => false;

if (alias === 'analise-documentacao' || alias === 'correcao-pendencias') {
  TableAnalysys({
    table: document.querySelector('#tbl-documents'),
    dataAttr: 'data-analysis',
    toggleMode: 'visibility',
    reproveOptions: [
      'Reprovado'
    ],
    approveButtons: [
      '#btnFinish'
    ]
  });
}
//# sourceMappingURL=app.js.map

'use strict';

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

const defaults = {
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
    ...defaults,
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

document
  .addEventListener('DOMContentLoaded', () => {
    Binder();

    document
      .querySelector('#section-analysis')
      .removeAttribute('data-if');

    document
      .querySelectorAll('[data-analysis]')
      .forEach(cell => cell.removeAttribute('data-analysis'));
  });
//# sourceMappingURL=report.js.map

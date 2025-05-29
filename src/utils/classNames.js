export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const conditionalClass = (condition, trueClass, falseClass = '') => {
  return condition ? trueClass : falseClass;
};  
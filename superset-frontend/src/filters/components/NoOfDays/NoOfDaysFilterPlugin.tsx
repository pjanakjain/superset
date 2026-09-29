/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.
 */

import { useEffect, useState } from 'react';

import { ExtraFormData } from '@superset-ui/core';

import { FormItem, Select } from '@superset-ui/core/components';

import { FilterPluginStyle } from '../common';

import { DEFAULT_FORM_DATA, PluginFilterNoOfDaysProps } from './types';

const NO_OF_DAYS_OPTIONS = [
  { label: '30', value: '30' },
  { label: '60', value: '60' },
  { label: '90', value: '90' },
  { label: '120', value: '120' },
  { label: '180', value: '180' },
  { label: '365', value: '365' },
];

export default function PluginFilterNoOfDays(props: PluginFilterNoOfDaysProps) {
  const {
    formData,
    height,
    width,
    setDataMask,
    setFocusedFilter,
    unsetFocusedFilter,
    setFilterActive,
    filterState,
    inputRef,
  } = props;

  const defaultValue = formData.defaultValue ?? DEFAULT_FORM_DATA.defaultValue;

  const [value, setValue] = useState<string>(defaultValue?.[0] ?? '90');

  const handleChange = (selectedValue?: string) => {
    const days = selectedValue ?? '90';

    setValue(days);

    const extraFormData: ExtraFormData = {
      time_range: `Last ${days} days`,
    };

    setDataMask({
      extraFormData,
      filterState: {
        label: days,
        value: [days],
      },
    });
  };

  useEffect(() => {
    handleChange(defaultValue?.[0] ?? '90');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultValue)]);

  useEffect(() => {
    if (filterState.value?.[0]) {
      setValue(String(filterState.value[0]));
    }
  }, [filterState.value]);

  return (
    <FilterPluginStyle height={height} width={width}>
      <FormItem validateStatus={filterState.validateStatus}>
        <Select
          name={formData.nativeFilterId}
          value={value}
          options={NO_OF_DAYS_OPTIONS}
          onChange={handleChange}
          onBlur={unsetFocusedFilter}
          onFocus={setFocusedFilter}
          ref={inputRef}
          onOpenChange={setFilterActive}
        />
      </FormItem>
    </FilterPluginStyle>
  );
}

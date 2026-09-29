/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.
 */

import { ChartProps } from '@superset-ui/core';
import { noOp } from 'src/utils/common';

import { DEFAULT_FORM_DATA } from './types';

export default function transformProps(chartProps: ChartProps) {
  const { formData, height, hooks, width, filterState, inputRef } = chartProps;

  const {
    setDataMask = noOp,
    setHoveredFilter = noOp,
    unsetHoveredFilter = noOp,
    setFocusedFilter = noOp,
    unsetFocusedFilter = noOp,
    setFilterActive = noOp,
  } = hooks;

  return {
    filterState,
    width,
    height,
    data: [],
    formData: {
      ...DEFAULT_FORM_DATA,
      ...formData,
    },
    setDataMask,
    setHoveredFilter,
    unsetHoveredFilter,
    setFocusedFilter,
    unsetFocusedFilter,
    setFilterActive,
    inputRef,
  };
}

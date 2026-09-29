/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { useEffect, useState } from 'react';
import { Dayjs } from 'dayjs';

import { RangePicker } from '@superset-ui/core/components/DatePicker';

import { extendedDayjs } from '@superset-ui/core/utils/dates';

import { FrameComponentProps } from '../types';
import { DAYJS_FORMAT } from '../utils';

const DISPLAY_FORMAT = 'DD MMM YYYY';

const parseDate = (value: string): Dayjs =>
  extendedDayjs(value).utc().startOf('day');

/**
 * Convert the user-visible inclusive date range into
 * Superset's exclusive-end time range.
 *
 * Example:
 *
 * UI:
 *   21 Jan 2025 - 27 Jan 2025
 *
 * Superset:
 *   2025-01-21T00:00:00 : 2025-01-28T00:00:00
 */
const encodeDateRange = (since: Dayjs, until: Dayjs): string =>
  `${since.format(DAYJS_FORMAT)} : ${until
    .add(1, 'day')
    .startOf('day')
    .format(DAYJS_FORMAT)}`;

export const SimpleDateRangeFrame = ({
  value,
  onChange,
}: FrameComponentProps) => {
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);

  useEffect(() => {
    if (!value || value === 'No filter') {
      setDateRange([null, null]);
      return;
    }

    const [rawSince, rawUntil] = value.split(' : ');

    if (!rawSince || !rawUntil) {
      setDateRange([null, null]);
      return;
    }

    const parsedSince = parseDate(rawSince);
    const parsedUntil = parseDate(rawUntil);

    if (parsedSince.isValid() && parsedUntil.isValid()) {
      setDateRange([parsedSince, parsedUntil.subtract(1, 'day')]);
    }
  }, [value]);

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (!dates) {
      setDateRange([null, null]);
      return;
    }

    const [since, until] = dates;

    if (!since || !until) {
      setDateRange(dates);
      return;
    }

    const normalizedSince = since.startOf('day');

    const normalizedUntil = until.startOf('day');

    setDateRange([normalizedSince, normalizedUntil]);

    onChange(encodeDateRange(normalizedSince, normalizedUntil));
  };

  return (
    <RangePicker
      value={dateRange}
      format={DISPLAY_FORMAT}
      placeholder={['Start date', 'End date']}
      allowClear
      onChange={handleRangeChange}
    />
  );
};

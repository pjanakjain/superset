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

import rison from 'rison';
import { ReactNode, useState, useEffect, useMemo } from 'react';

import {
  css,
  styled,
  t,
  NO_TIME_RANGE,
  SupersetTheme,
  useCSSTextTruncation,
  SupersetClient,
} from '@superset-ui/core';

import {
  Button,
  Constants,
  Divider,
  Tooltip,
} from '@superset-ui/core/components';

import ControlHeader from 'src/explore/components/ControlHeader';
import { Icons } from '@superset-ui/core/components/Icons';
import { useDebouncedEffect } from 'src/explore/exploreUtils';
import { noOp } from 'src/utils/common';

import ControlPopover from '../ControlPopover/ControlPopover';

import { DateFilterControlProps } from './types';

import { DateFilterTestKey, guessFrame, useDefaultTimeFilter } from './utils';

import { DateLabel, SimpleDateRangeFrame } from './components';

const ContentStyleWrapper = styled.div`
  ${({ theme }) => css`
    .ant-row {
      margin-top: 8px;
    }

    .ant-picker {
      padding: 4px 17px 4px;
      border-radius: 4px;
    }

    .ant-divider-horizontal {
      margin: 16px 0;
    }

    .control-label {
      font-size: ${theme.fontSizeSM}px;
      line-height: 16px;
      margin: 8px 0;
    }

    .section-title {
      font-style: normal;
      font-weight: ${theme.fontWeightStrong};
      font-size: 15px;
      line-height: 24px;
      margin-bottom: 8px;
    }

    .control-anchor-to {
      margin-top: 16px;
    }

    .control-anchor-to-datetime {
      width: 217px;
    }

    .footer {
      text-align: right;
    }
  `}
`;

const IconWrapper = styled.span`
  span {
    margin-right: ${({ theme }) => 2 * theme.sizeUnit}px;
    vertical-align: middle;
  }

  .text {
    vertical-align: middle;
  }

  .error {
    color: ${({ theme }) => theme.colorError};
  }
`;

const formatDateEndpoint = (dttm: string, isStart = false): string =>
  dttm.replace('T00:00:00', '') || (isStart ? '-∞' : '∞');

const formatResolvedTimeRange = (since: string, until: string): string =>
  `${formatDateEndpoint(since, true)} ≤ col < ${formatDateEndpoint(until)}`;

const getTooltipTitle = (
  isLabelTruncated: boolean,
  label: string | undefined,
  range: string | undefined,
) =>
  isLabelTruncated ? (
    <div>
      {label && <strong>{label}</strong>}

      {range && (
        <div
          css={(theme: SupersetTheme) => css`
            margin-top: ${theme.sizeUnit}px;
          `}
        >
          {range}
        </div>
      )}
    </div>
  ) : (
    range || null
  );

/**
 * Resolve a Superset time range using one API request.
 *
 * Returns:
 *
 * rawRange:
 *   2025-01-21T00:00:00 : 2025-01-28T00:00:00
 *
 * actualRange:
 *   2025-01-21 ≤ col < 2025-01-28
 */
const resolveTimeRange = async (timeRange: string) => {
  const query = rison.encode_uri(timeRange);

  const response = await SupersetClient.get({
    endpoint: `/api/v1/time_range/?q=${query}`,
  });

  const result = response?.json?.result?.[0];

  const since = result?.since || '';
  const until = result?.until || '';

  if (!since || !until) {
    throw new Error('Unable to resolve time range');
  }

  return {
    since,
    until,
    rawRange: `${since} : ${until}`,
    actualRange: formatResolvedTimeRange(since, until),
  };
};

export default function DateFilterLabel(props: DateFilterControlProps) {
  const {
    name,
    onChange,
    onOpenPopover = noOp,
    onClosePopover = noOp,
    isOverflowingFilterBar = false,
  } = props;

  const defaultTimeFilter = useDefaultTimeFilter();

  const value = props.value ?? defaultTimeFilter;

  const [actualTimeRange, setActualTimeRange] = useState<string>(value);

  const [show, setShow] = useState<boolean>(false);

  const guessedFrame = useMemo(() => guessFrame(value), [value]);

  const [lastFetchedTimeRange, setLastFetchedTimeRange] = useState(value);

  const [timeRangeValue, setTimeRangeValue] = useState(value);

  const [validTimeRange, setValidTimeRange] = useState<boolean>(false);

  /**
   * Canonical absolute range used by
   * SimpleDateRangeFrame.
   */
  const [resolvedTimeRange, setResolvedTimeRange] = useState<string>(value);

  const [tooltipTitle, setTooltipTitle] = useState<ReactNode | null>(value);

  const [labelRef, labelIsTruncated] = useCSSTextTruncation<HTMLSpanElement>();

  /**
   * Resolve the current filter value.
   *
   * This performs one request and obtains
   * both the raw range and display range.
   */
  useEffect(() => {
    let cancelled = false;

    if (value === NO_TIME_RANGE) {
      setActualTimeRange(NO_TIME_RANGE);
      setResolvedTimeRange(NO_TIME_RANGE);
      setTooltipTitle(null);
      setValidTimeRange(true);
      setLastFetchedTimeRange(NO_TIME_RANGE);

      return () => {
        cancelled = true;
      };
    }

    resolveTimeRange(value)
      .then(({ rawRange, actualRange }) => {
        if (cancelled) {
          return;
        }

        /**
         * Store the absolute range used
         * by the simplified date picker.
         */
        setResolvedTimeRange(rawRange);

        /**
         * Preserve existing Superset label
         * behavior for common/calendar/current
         * filters.
         */
        if (
          guessedFrame === 'Common' ||
          guessedFrame === 'Calendar' ||
          guessedFrame === 'Current' ||
          guessedFrame === 'No filter'
        ) {
          setActualTimeRange(value);

          setTooltipTitle(
            getTooltipTitle(labelIsTruncated, value, actualRange),
          );
        } else {
          setActualTimeRange(actualRange);

          setTooltipTitle(
            getTooltipTitle(labelIsTruncated, actualRange, value),
          );
        }

        setValidTimeRange(true);

        setLastFetchedTimeRange(value);
      })
      .catch(error => {
        if (cancelled) {
          return;
        }

        setValidTimeRange(false);

        setTooltipTitle(value || null);
      });

    return () => {
      cancelled = true;
    };
  }, [guessedFrame, labelIsTruncated, labelRef, value]);

  /**
   * Validate a changed date range after
   * the existing Superset debounce period.
   */
  useDebouncedEffect(
    () => {
      if (timeRangeValue === NO_TIME_RANGE) {
        setLastFetchedTimeRange(NO_TIME_RANGE);

        setValidTimeRange(true);

        return;
      }

      if (lastFetchedTimeRange !== timeRangeValue) {
        resolveTimeRange(timeRangeValue)
          .then(() => {
            setValidTimeRange(true);

            setLastFetchedTimeRange(timeRangeValue);
          })
          .catch(() => {
            setValidTimeRange(false);
          });
      }
    },
    Constants.SLOW_DEBOUNCE,
    [timeRangeValue],
  );

  function onSave() {
    onChange(timeRangeValue);

    setShow(false);

    onClosePopover();
  }

  function onOpen() {
    /**
     * Open the picker using the resolved
     * absolute date range.
     */
    setTimeRangeValue(resolvedTimeRange);

    /**
     * The resolved range has already been
     * validated by the initial request.
     *
     * This prevents an unnecessary API
     * request immediately after opening.
     */
    setLastFetchedTimeRange(resolvedTimeRange);

    setValidTimeRange(true);

    setShow(true);

    onOpenPopover();
  }

  function onHide() {
    /**
     * Cancel restores the last resolved
     * absolute range.
     */
    setTimeRangeValue(resolvedTimeRange);

    setLastFetchedTimeRange(resolvedTimeRange);

    setValidTimeRange(true);

    setShow(false);

    onClosePopover();
  }

  const toggleOverlay = () => {
    if (show) {
      onHide();
    } else {
      onOpen();
    }
  };

  const overlayContent = (
    <ContentStyleWrapper>
      <SimpleDateRangeFrame
        value={resolvedTimeRange}
        onChange={setTimeRangeValue}
      />

      <Divider />

      <div className="footer">
        <Button
          buttonStyle="secondary"
          cta
          key="cancel"
          onClick={onHide}
          data-test={DateFilterTestKey.CancelButton}
        >
          {t('CANCEL')}
        </Button>

        <Button
          buttonStyle="primary"
          cta
          disabled={!validTimeRange}
          key="apply"
          onClick={onSave}
          data-test={DateFilterTestKey.ApplyButton}
        >
          {t('APPLY')}
        </Button>
      </div>
    </ContentStyleWrapper>
  );

  const popoverContent = (
    <ControlPopover
      autoAdjustOverflow={false}
      trigger="click"
      placement="right"
      content={overlayContent}
      title={
        <IconWrapper>
          <Icons.EditOutlined />

          <span className="text">{t('Edit time range')}</span>
        </IconWrapper>
      }
      defaultOpen={show}
      open={show}
      onOpenChange={toggleOverlay}
      overlayStyle={{
        width: '600px',
      }}
      destroyTooltipOnHide
      getPopupContainer={nodeTrigger =>
        isOverflowingFilterBar
          ? (nodeTrigger.parentNode as HTMLElement)
          : document.body
      }
      overlayClassName="time-range-popover"
    >
      <Tooltip placement="top" title={tooltipTitle}>
        <DateLabel
          name={name}
          aria-labelledby={`filter-name-${props.name}`}
          aria-describedby={`date-label-${props.name}`}
          label={actualTimeRange}
          isActive={show}
          isPlaceholder={actualTimeRange === NO_TIME_RANGE}
          data-test={DateFilterTestKey.PopoverOverlay}
          ref={labelRef}
        />
      </Tooltip>
    </ControlPopover>
  );

  return (
    <>
      <ControlHeader {...props} />
      {popoverContent}
    </>
  );
}

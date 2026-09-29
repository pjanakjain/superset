/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.
 */

import { ControlPanelConfig } from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('UI Configuration'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'defaultValue',
            config: {
              type: 'SelectControl',
              label: t('Default value'),
              default: '90',
              clearable: false,
              choices: [
                ['30', '30'],
                ['60', '60'],
                ['90', '90'],
                ['120', '120'],
                ['180', '180'],
                ['365', '365'],
              ],
              renderTrigger: true,
              description: t(
                'Default rolling number of days used by the filter',
              ),
            },
          },
        ],
      ],
    },
  ],
};

export default config;

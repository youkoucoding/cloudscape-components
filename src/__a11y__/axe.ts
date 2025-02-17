// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Axe from 'axe-core';

export const spec: Axe.Spec = {
  checks: [
    {
      id: 'aria-roledescription',
      options: {
        supportedRoles: [
          // these are default roles from this list
          // https://github.com/dequelabs/axe-core/blob/c3a7d1648d0e319003f573f6b4cfe94a1a043808/lib/checks/aria/aria-roledescription.json#L5
          'button',
          'img',
          'checkbox',
          'radio',
          'combobox',
          'menuitemcheckbox',
          'menuitemradio',
          // these are our custom additions
          'application',
          'list',
        ],
      },
    },
  ],

  rules: [
    // Skip the empty table header rule which fails for the single selection table header
    { id: 'empty-table-header', enabled: false },
  ],
};

export const runOptions: Axe.RunOptions = {
  resultTypes: ['violations', 'incomplete'],
};

export const expectNoAxeViolations = async (element: HTMLElement) => {
  Axe.configure(spec);

  // Disable color-contrast checks as unavailable in unit test environment.
  const result = await Axe.run(element, { ...runOptions, rules: { 'color-contrast': { enabled: false } } });

  expect(result.violations).toHaveLength(0);
  expect(result.incomplete).toHaveLength(0);
};

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { useContext, useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { AppLayoutContext } from '../app-layout/visual-refresh/context';
import { applyDisplayName } from '../internal/utils/apply-display-name';
import { ContentLayoutProps } from './interfaces';
import { getBaseProps } from '../internal/base-component';
import useBaseComponent from '../internal/hooks/use-base-component';
import { useContainerQuery } from '../internal/hooks/container-queries';
import { useMergeRefs } from '../internal/hooks/use-merge-refs';
import { useVisualRefresh } from '../internal/hooks/use-visual-mode';
import styles from './styles.css.js';

export { ContentLayoutProps };

export default function ContentLayout({ children, disableOverlap, header, ...rest }: ContentLayoutProps) {
  const baseProps = getBaseProps(rest);
  const { breadcrumbs, setDynamicOverlapHeight } = useContext(AppLayoutContext);
  const rootElement = useRef<HTMLDivElement>(null);
  const { __internalRootRef } = useBaseComponent('ContentLayout');
  const mergedRef = useMergeRefs(rootElement, __internalRootRef);
  const isVisualRefresh = useVisualRefresh(rootElement);

  /**
   * Observe the height of the ContentLayout background element. This value will be used to
   * setthe dynamicOverlapHeight property in the AppLayout which will extend the overlap
   * height of the AppLayout down to include this element. This creates the appearance
   * of a seamless dark background when these two components are used together.
   */
  const [overlapContainerQuery, overlapElement] = useContainerQuery(rect => rect.height);

  useLayoutEffect(
    function handleDynamicOverlapHeight() {
      if (isVisualRefresh) {
        setDynamicOverlapHeight(overlapContainerQuery ?? 0);
      }
    },
    [isVisualRefresh, overlapContainerQuery, setDynamicOverlapHeight]
  );

  /**
   * Disable the overlap if the component is missing either a header or child
   * content. If the component is not using visual refresh then the overlap
   * will not displayed at all. This is handled in the CSS not the JavaScript.
   */
  const isOverlapDisabled = !children || !header || disableOverlap;

  return (
    <div
      {...baseProps}
      className={clsx(baseProps.className, styles.layout, {
        [styles['is-overlap-disabled']]: isOverlapDisabled,
        [styles['is-visual-refresh']]: isVisualRefresh,
      })}
      ref={mergedRef}
    >
      <div
        className={clsx(
          styles.background,
          { [styles['is-overlap-disabled']]: isOverlapDisabled },
          'awsui-context-content-header'
        )}
        ref={overlapElement}
      />

      {header && (
        <div
          className={clsx(styles.header, { [styles['has-breadcrumbs']]: breadcrumbs }, 'awsui-context-content-header')}
        >
          {header}
        </div>
      )}

      {children && <div className={styles.content}>{children}</div>}
    </div>
  );
}

applyDisplayName(ContentLayout, 'ContentLayout');

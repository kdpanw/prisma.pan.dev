/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, memo } from "react";
import clsx from "clsx";
import {
  isSamePath,
  usePrevious,
  Collapsible,
  useCollapsible,
} from "@docusaurus/theme-common";
import Link from "@docusaurus/Link";
import isInternalUrl from "@docusaurus/isInternalUrl";
import IconExternalLink from "@theme/IconExternalLink";
import styles from "./styles.module.css";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useWindowSize from "@theme/hooks/useWindowSize";
import useBaseUrl from "@docusaurus/useBaseUrl";

const isActiveSidebarItem = (item, activePath) => {
  if (item.type === "link") {
    return isSamePath(item.href, activePath);
  }

  if (item.type === "category") {
    return item.items.some((subItem) =>
      isActiveSidebarItem(subItem, activePath)
    );
  }

  return false;
}; // Optimize sidebar at each "level"
// TODO this item should probably not receive the "activePath" props
// TODO this triggers whole sidebar re-renders on navigation

export const DocSidebarItems = memo(function DocSidebarItems({
  items,
  ...props
}) {
  return (
    <>
      {items.map((item, index) => (
        <DocSidebarItem
          key={index} // sidebar is static, the index does not change
          item={item}
          {...props}
        />
      ))}
    </>
  );
});
export default function DocSidebarItem({ item, ...props }) {
  switch (item.type) {
    case "category":
      if (item.items.length === 0) {
        return null;
      }
      return <DocSidebarItemCategory item={item} {...props} />;

    case "link":
      if (item.customProps === "versioned") {
        return <DocSidebarVersionDropdown item={item} {...props} />;
      }
    default:
      return <DocSidebarItemLink item={item} {...props} />;
  }
}

function DocSidebarVersionDropdown({
  item,
  onItemClick,
  activePath,
  ...props
}) {
  const { siteConfig } = useDocusaurusContext();
  const windowSize = useWindowSize();

  // Mobile sidebar not visible on hydration: can avoid SSR rendering
  const shouldRender = windowSize === "mobile"; // || windowSize === 'ssr';

  if (windowSize !== "mobile") {
    return (
      <nav
        className="navbar navbar--fixed-top navbar--dark"
        style={{
          top: "0",
          padding: "-.5rem 0 0 0",
          height: "40px",
        }}
      >
        <div className="navbar__inner">
          <div className="navbar__items">
            <div className="navbar__item dropdown dropdown--hoverable">
              <a className="navbar__link">
                Select API Version: <b>{item.label} ▼</b>
              </a>
              <ul className="dropdown__menu">
                {siteConfig.customFields.api_versions.map((Ver, i) => (
                  <li key={i}>
                    <Link
                      className={
                        "dropdown__link " +
                        (item.label === Ver.version
                          ? "dropdown__link--active"
                          : "")
                      }
                      to={Ver.to}
                    >
                      {Ver.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </nav>
    );
  } else {
    return (
      <div>
        {siteConfig.customFields.api_versions.map((Ver, i) => (
          <Link
            className={
              "button button--outline button--secondary button--md " +
              (typeof window !== "undefined" &&
              window.location.pathname.split("/")[2] ==
                useBaseUrl(Ver.to).split("/")[2]
                ? "button--active--tab shadow--lw"
                : "")
            }
            style={{
              borderRadius: "0 0 0 0",
              borderColor: "var(--ifm-contents-border-color)",
              borderWidth: "0",
              padding:
                "calc( var(--ifm-button-padding-vertical) * 1.5  ) calc( var(--ifm-button-padding-horizontal) * .65 )",
            }}
            key={i}
            to={useBaseUrl(Ver.to)}
          >
            {Ver.label}
          </Link>
        ))}
      </div>
    );
  }
}

// If we navigate to a category and it becomes active, it should automatically expand itself
function useAutoExpandActiveCategory({ isActive, collapsed, setCollapsed }) {
  const wasActive = usePrevious(isActive);
  useEffect(() => {
    const justBecameActive = isActive && !wasActive;

    if (justBecameActive && collapsed) {
      setCollapsed(false);
    }
  }, [isActive, wasActive, collapsed]);
}

function DocSidebarItemCategory({ item, onItemClick, activePath, ...props }) {
  const { items, label, collapsible } = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const { collapsed, setCollapsed, toggleCollapsed } = useCollapsible({
    // active categories are always initialized as expanded
    // the default (item.collapsed) is only used for non-active categories
    initialState: () => {
      if (!collapsible) {
        return false;
      }

      return isActive ? false : item.collapsed;
    },
  });
  useAutoExpandActiveCategory({
    isActive,
    collapsed,
    setCollapsed,
  });
  return (
    <li
      className={clsx("menu__list-item", {
        "menu__list-item--collapsed": collapsed,
      })}
    >
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a
        className={clsx("menu__link", {
          "menu__link--sublist": collapsible,
          "menu__link--active": collapsible && isActive,
          [styles.menuLinkText]: !collapsible,
        })}
        onClick={
          collapsible
            ? (e) => {
                e.preventDefault();
                toggleCollapsed();
              }
            : undefined
        }
        href={collapsible ? "#" : undefined}
        {...props}
      >
        {label}
      </a>

      <Collapsible lazy as="ul" className="menu__list" collapsed={collapsed}>
        <DocSidebarItems
          items={items}
          tabIndex={collapsed ? -1 : 0}
          onItemClick={onItemClick}
          activePath={activePath}
        />
      </Collapsible>
    </li>
  );
}

function DocSidebarItemLink({ item, onItemClick, activePath, ...props }) {
  const { href, label, customProps } = item;
  const isActive = isActiveSidebarItem(item, activePath);

  var method = "noop";
  if (customProps) {
    method = customProps.method;
  }
  return (
    <li className="menu__list-item" key={label}>
      <Link
        className={clsx("menu__link", method, {
          "menu__link--active": isActive,
        })}
        to={href}
        {...(isInternalUrl(href) && {
          isNavLink: true,
          exact: true,
          onClick: onItemClick,
        })}
        {...props}
      >
        {isInternalUrl(href) ? (
          label
        ) : (
          <span>
            {label}
            <IconExternalLink />
          </span>
        )}
      </Link>
    </li>
  );
}

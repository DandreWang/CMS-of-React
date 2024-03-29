import React from 'react';
import { Link } from 'dva/router';
import PageHeader from '../components/PageHeader';
import styles from './PageHeaderLayout.less';

export default ({ children, wrapperClassName, top, ...restProps }) => {
  const { contentStyle = {} } = restProps || {};

  return (
    <div style={{ margin: '-24px -24px 0' }} className={wrapperClassName}>
      {top}
      <PageHeader key="pageheader" {...restProps} linkElement={Link}/>
      {children ? <div className={styles.content} style={contentStyle}>{children}</div> : null}
    </div>
  )

}

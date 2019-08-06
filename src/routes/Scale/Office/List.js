import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import {
  Row,
  Col,
  Card,
  Menu,
  Divider,
  Popconfirm,
  Dropdown,
  message,
  Form,
  Modal,
  Input,
  Select,
  Icon,
  Button,
  InputNumber,
  DatePicker,
  Badge,
  Avatar, AutoComplete,
} from 'antd';
import TableDiy from 'components/TableDiy';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import { routerRedux } from 'dva/router';
import styles from './List.less';
import { dataHandler } from '../../../utils/dataHandler';
import { tableHandler } from '../../../utils/tableHandler';
import request from '../../../utils/request';
import { urls } from '../../../utils/urls';
import lodash from 'lodash';
import { router } from '../../../utils/router';
import { storageHandler } from '../../../utils/storageHandler';

const RangePicker = DatePicker.RangePicker;
const FormItem = Form.Item;
const { Option } = Select;

const formItemLayout = tableHandler.styles.formItemLayoutOfListPage;

let defaultParams,name;
let queryParamForExport;

@connect(() => ({
}))
@Form.create()
export default class AnyClass extends PureComponent {

  constructor(props) {
    super(props);
    this.columns = [
      // id、code、name、create_time_str、create_worker_account_id_name
      {
        title: '科室名称',
        dataIndex: 'name',
        align: 'center',
      },
      {
        title: '操作',
        align: 'center',
        // fixed: 'right',
        // width: 180,
        render: (text, record) => {
          return (
            <div className="editable-row-operations">
              <Fragment>
                <a onClick={() => this.jump({ type:'查看', record })}>查看</a>
                <Divider type="vertical" />
                <a onClick={() => this.jump({ type:'量表授权', record })}>量表授权</a>
              </Fragment>
            </div>
          );

        },
      },

      {
        title: '科室编码',
        dataIndex: 'code',
        align: 'center',
      },
      {
        title: '已授权量表',
        dataIndex: 'form_names',
        align: 'center',
        className:'column-description',
        render:(text,record)=>{
          const str = (text||[]).join('、');
          return <span className='column-text' title={str}>{str}</span>

        },
      },
    ];
  }

  state = {
    expandForm: false,
    // 场景：分页、排序
    formValues: {},
    list:[],

    loading:true,

    categoryOptionsData:[],

    name:'',
  };

  componentDidMount() {

    defaultParams = {current:1,pageSize:20};

    this.get_department_listAll();

    this.get_data();

  }

  get_department_listAll = (callback=()=>{})=>{

    request(urls.department_listAll,{
      body:{},
      success:categoryOptionsData=>{
        this.setState({categoryOptionsData});
      },
      fail:errmsg=>{
        message.error(errmsg || '获取失败');
      },
      complete:()=>{
        callback && callback();
      },
    });
  };

  get_data = (params) => {

    this.setState({loading:true});

    let payload = lodash.pickBy(params, (value)=>{
      return value!==undefined && value!=='';
    });

    payload = Object.assign({},defaultParams,payload);

    queryParamForExport = payload;


    request(urls.admin_evaluate_subject_department_auth_list,{
      body:{...payload},
      success:list=>{
        this.setState({list});
      },
      fail:errmsg=>{
        message.error(errmsg || '获取失败');
      },
      complete:()=>{
        this.setState({loading:false})
      },
    });

  };

  jump = ({ type, record }) => {
    const {id} = record;
    const {dispatch} = this.props;

    if(['量表授权'].indexOf(type)!==-1){
      router.jump({
        dispatch,
        pathname: `/scale/office-edit/${id}`,
      });
    }else if(type==='查看'){
      router.jump({
        dispatch,
        pathname: `/scale/office-detail/${id}`,
      });
    }
  };

  handleTableChange = (pagination, filtersArg, sorter) => {

    const { formValues } = this.state;

    const params = {
      ...formValues,
      current: pagination.current,
      pageSize: pagination.pageSize,
    };

    this.get_data(params);

  };

  handleFormReset = () => {
    const { form,dispatch } = this.props;
    form.resetFields();
    this.setState({
      formValues: {},
      name:'',
    });
    this.get_data();
  };

  toggleForm = () => {
    this.setState({
      expandForm: !this.state.expandForm,
    });
  };

  handleSearch = (event) => {
    event.preventDefault();

    const { form } = this.props;

    const {name} = this.state;

    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }

      let params = lodash.pickBy(fieldsValue, (value)=>{
        return value!==undefined && value!=='';
      });

      if(name){
        params.name = name;
      }

      this.setState({
        formValues: params,
      });

      this.get_data(params);

    });
  };

  create = ()=>{
    const { dispatch } = this.props;
    router.jump({
      dispatch,
      pathname: '/scale/office-add',
    });
  };

  renderSimpleForm() {
    const { form: { getFieldDecorator } } = this.props;
    const {categoryOptionsData,name} = this.state;
    let dataSource = [];
    if(!name){
      dataSource = categoryOptionsData.map(v=>v.name);
    }else{
      dataSource = categoryOptionsData.filter(v=>v.name.indexOf(name)===0).map(v=>v.name)
    }
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24 }}>
          <Col md={8}>
            <FormItem {...formItemLayout} label="科室编码">
              {getFieldDecorator('code')(
                <Input placeholder="请输入" />,
              )}
            </FormItem>
          </Col>
          <Col md={8}>
            <FormItem {...formItemLayout} label="科室名称">
              <AutoComplete
                dataSource={dataSource}
                style={{ width: 200 }}
                onSelect={this.onInputSelect}
                onSearch={this.onInputMatch}
                onChange={this.onInputChange}
                placeholder=""
                value={name}
              />
            </FormItem>
          </Col>
          <Col md={8}>
            <span className={styles.submitButtons}>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button className={styles.resetBtn} onClick={this.handleFormReset}>重置</Button>
              <a href={`${urls.admin_evaluate_subject_department_auth_export}/?${dataHandler.obj2queryString({...queryParamForExport,...storageHandler.getCurrentUserInfo()})}`} style={{ marginLeft: 8 }} ><Button type="primary">导出</Button></a>
            </span>
          </Col>
        </Row>
      </Form>
    );
  }


  onInputMatch = (value)=>{

    this.onInputSelect(value);

  };

  onInputChange = (value)=>{
    this.onInputSelect(value);
  };

  onInputSelect = (value)=>{

    this.setState({name:value})

  };

  renderForm() {
    return this.renderSimpleForm();
  }

  render() {
    const {loading,list= []} = this.state;
    const {columns} = this;
    return (
      <PageHeaderLayout title="">
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListForm}>
              {this.renderForm()}
            </div>
            {/*<div className={styles.tableListOperator}>*/}
              {/*<Button*/}
                {/*icon="plus"*/}
                {/*type="primary"*/}
                {/*onClick={this.create}*/}
              {/*>*/}
                {/*新建*/}
              {/*</Button>*/}
            {/*</div>*/}
            <TableDiy
              rowKey='code'
              loading={loading}
              data={list}
              columns={columns}
              onChange={this.handleTableChange}
              // scroll={{ x: '130%' }} /* todo */ // 列数很多时才设置
            />
          </div>
        </Card>

      </PageHeaderLayout>
    );
  }
}
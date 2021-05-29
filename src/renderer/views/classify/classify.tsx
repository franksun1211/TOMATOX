import React, { ReactElement } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import TomatoxWaterfall from '@/components/tomatox-waterfall/tomatox-waterfall';
import { Spin } from 'antd';
import CustomSpin from '@/components/custom-spin/custom-spin';
import Scrollbars from 'react-custom-scrollbars';
import { queryResources, queryTypes } from '@/utils/request/modules/queryResources';
import store from '@/utils/store';
import { filterResources } from '@/utils/filterResources';
import cssM from './classify.scss';

export default class Classify extends React.Component<any, any> {
    private page = 0;
    private pageCount = 10;

    constructor(props: any) {
        super(props);
        this.state = {
            types: {},
            selectedType: '',
            cardsData: [],
            recommendLoading: false
        };
    }

    async componentWillMount() {
        store.setState('GLOBAL_LOADING', true);
        const res = (await queryTypes()) as any;
        const types: Record<string, number> = {};
        res.class.forEach((item: any) => {
            types[item.type_name] = item.type_id;
        });
        this.setState({
            types,
            selectedType: Object.keys(types)[0]
        });
        this.getRecommendLst();
    }

    private getRecommendLst() {
        Promise.all([
            queryResources(++this.page, this.state.types[this.state.selectedType]),
            queryResources(++this.page, this.state.types[this.state.selectedType]),
            queryResources(++this.page, this.state.types[this.state.selectedType])
        ]).then(reses => {
            const allList: IplayResource[] = [];
            reses.forEach(res => {
                const { list, pagecount } = res;
                this.pageCount = pagecount;
                allList.push(...list);
            });
            if (store.getState('GLOBAL_LOADING')) {
                store.setState('GLOBAL_LOADING', false);
            }
            this.setState({
                recommendLoading: this.page < this.pageCount,
                cardsData: [...this.state.cardsData, ...filterResources(allList)]
            });
        });
    }

    private changeType(key: string, item: number) {
        store.setState('GLOBAL_LOADING', true);
        this.setState(
            this.setState({
                selectedType: key,
                cardsData: [],
                recommendLoading: false
            }),
            () => {
                this.page = 0;
                this.getRecommendLst();
            }
        );
    }

    renderClassify() {
        const res: ReactElement[] = [];
        Object.keys(this.state.types).forEach(item => {
            res.push(
                <span
                    key={item}
                    className={`${cssM.typeItem} ${
                        item === this.state.selectedType ? cssM.typeItemActive : ''
                    }`}
                    onClick={() => this.changeType(item, this.state.types[item])}>
                    {item}
                </span>
            );
        });
        return res;
    }

    render(): React.ReactNode {
        return (
            <Scrollbars>
                <InfiniteScroll
                    initialLoad={false}
                    pageStart={1}
                    hasMore={this.state.recommendLoading}
                    loadMore={this.getRecommendLst.bind(this)}
                    style={{ paddingTop: 90 }}
                    useWindow={false}>
                    <div className={cssM.typeWrapper}>{this.renderClassify()}</div>
                    <TomatoxWaterfall data={this.state.cardsData} />
                    <div style={{ height: 100, position: 'relative' }}>
                        <Spin
                            size={'large'}
                            indicator={<CustomSpin />}
                            spinning={this.state.recommendLoading}
                            />
                    </div>
                </InfiniteScroll>
            </Scrollbars>
        );
    }
}

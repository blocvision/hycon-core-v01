import * as React from "react"
import update = require("react-addons-update")
import { NotFound } from "./notFound"
import { IBlock, IResponseError, IRest, ITxProp } from "./rest"
import { TxLine } from "./txLine"
interface IBlockProps {
    rest: IRest
    hash: string
    notFound: boolean
}

interface IBlockViewState {
    rest: IRest
    block?: IBlock
    txs: ITxProp[]
    hash: string
    amount?: string
    fees?: string
    length?: number
    volume?: string
    notFound: boolean
    hasMore: boolean
    index: number
    isUncle: boolean
    reward: string
    previousBlocks: string[]
}
export class BlockView extends React.Component<IBlockProps, IBlockViewState> {
    public mounted: boolean = false
    constructor(props: IBlockProps) {
        super(props)
        this.state = {
            hasMore: true,
            hash: props.hash,
            index: 1,
            isUncle: false,
            notFound: false,
            previousBlocks: [],
            rest: props.rest,
            reward: undefined,
            txs: [],
        }
    }
    public componentWillUnmount() {
        this.mounted = false
    }
    public componentDidMount() {
        this.mounted = true
        this.state.rest.setLoading(true)

        this.state.rest.getBlock(this.state.hash)
            .then((data: IBlock & IResponseError) => {
                this.state.rest.setLoading(false)
                if (!data.txs) { this.setState({ notFound: true }); return }
                if (!this.mounted) { return }
                this.setState({
                    amount: data.amount,
                    block: data,
                    fees: data.fee,
                    length: data.length,
                    previousBlocks: data.prevBlock !== undefined ? data.prevBlock.split(",") : [],
                    txs: data.txs,
                    volume: data.volume,
                })
                this.state.rest.isUncleBlock(this.state.hash)
                    .then((isUncle: boolean & IResponseError) => {
                        this.setState({ isUncle })
                    })
                if (this.state.block.miner === undefined) { return }

                this.state.rest.getMiningReward(this.state.hash)
                    .then((reward: string & IResponseError) => {
                        this.setState({ reward })
                    })
                    .catch((e: Error) => {
                        this.setState({ reward: "-" })
                        alert(e)
                    })
            })
            .catch((e: Error) => {
                alert(e)
            })
    }

    public render() {
        let uncleIndex = 0
        let txIndex = 0
        if (this.state.notFound) {
            return <NotFound />
        }
        if (!this.state.notFound && this.state.block === undefined) {
            return <div></div>
        }
        const date = new Date(this.state.block.timeStamp)
        return (
            <div>
                {this.state.isUncle // When this block is uncle, it shows this is the uncle of which block
                    ? <div className="contentTitle">Uncle</div>
                    : <div className="contentTitle">Block #{this.state.block.height}</div>
                }
                <table className="table_margined blockTable">
                    <thead>
                        <tr>
                            <th colSpan={2} className="tableBorder_Header tableHeader_floatLeft">Basic Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Height</td>
                            <td>{this.state.block.height}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Block Hash</td>
                            <td>{this.state.hash}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Previous Block Hash</td>
                            <td>
                                {this.state.previousBlocks.length > 0 ?
                                    <a href={`/block/${this.state.previousBlocks[0]}`}>
                                        {this.state.previousBlocks[0]}
                                    </a>
                                    : "None"}
                            </td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Uncles</td>
                            <td>{this.state.previousBlocks.length > 1
                                ?
                                this.state.previousBlocks.slice(1)
                                    .map((uncleHash: string) => {
                                        return (
                                            <div key={uncleIndex++}>
                                                <a href={`/block/${uncleHash}`}>{uncleHash}</a><br />
                                            </div>
                                        )
                                    })
                                : "None"}
                            </td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Merkle Root</td>
                            <td>{this.state.block.merkleRoot}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">State Root</td>
                            <td>{this.state.block.stateRoot}</td>
                        </tr>
                        <tr style={{ display: `${this.state.block.resultHash !== undefined ? ("contents") : ("none")}` }}>
                            <td className="tdSubTitle subTitle_width20">Result Hash</td>
                            <td>{this.state.block.resultHash}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Difficulty</td>
                            <td>{this.state.block.difficulty}</td>
                        </tr>
                        <tr style={{ display: `${this.state.block.nonce !== undefined ? ("contents") : ("none")}` }}>
                            <td className="tdSubTitle subTitle_width20">Nonce</td>
                            <td>{this.state.block.nonce}</td>
                        </tr>
                    </tbody>
                </table>

                <table className="table_margined blockTable">
                    <thead>
                        <tr>
                            <th colSpan={2} className="tableBorder_Header tableHeader_floatLeft">Mining Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ display: `${this.state.block.miner !== undefined ? ("contents") : ("none")}` }}>
                            <td className="tdSubTitle subTitle_width20">Miner</td>
                            <td>
                                <a href={`/address/${this.state.block.miner}`}>{this.state.block.miner}</a>
                            </td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Mined Time</td>
                            <td>{date.toString()}</td>
                        </tr>
                        <tr style={{ display: `${this.state.reward !== undefined ? ("contents") : ("none")}` }}>
                            <td className="tdSubTitle subTitle_width20">Reward</td>
                            <td>{this.state.reward}</td>
                        </tr>
                    </tbody>
                </table>

                {this.state.isUncle // Since uncle block has no tx, not need to show tx info
                    ? null
                    : (<table className="table_margined blockTable">
                        <thead>
                            <tr>
                                <th colSpan={2} className="tableBorder_Header tableHeader_floatLeft">Tx Info</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="tdSubTitle subTitle_width20">Num of Txs</td>
                                <td>{this.state.length}</td>
                            </tr>
                            <tr>
                                <td className="tdSubTitle subTitle_width20">Tx Volume</td>
                                <td>{this.state.volume}</td>
                            </tr>
                            <tr>
                                <td className="tdSubTitle subTitle_width20">Tx Transfer</td>
                                <td>{this.state.amount}</td>
                            </tr>
                            <tr>
                                <td className="tdSubTitle subTitle_width20">Tx Fees</td>
                                <td>{this.state.fees}</td>
                            </tr>
                        </tbody>
                    </table>)
                }
                {this.state.txs.map((tx: ITxProp) => {
                    return (
                        <div key={txIndex++}>
                            <TxLine tx={tx} rest={this.state.rest} />
                            <button className="dmdl-button mdl-js-button mdl-button--raised mdl-button--colored txAmtBtn green">
                                {tx.estimated + " HYCON"}
                            </button>
                        </div>
                    )
                })}
                {this.state.hasMore && this.state.txs.length > 0
                    ? <div><button className="btn btn-block btn-info" onClick={() => this.fetchNextTxs()}>Load more</button></div> : null}
            </div>
        )
    }

    private fetchNextTxs() {
        this.state.rest.getNextTxsInBlock(this.state.hash, this.state.txs[0].hash, this.state.index).then((result: ITxProp[]) => {
            if (!this.mounted) { return }
            if (result.length === 0) { this.setState({ hasMore: false }) }
            this.setState({
                index: this.state.index + 1,
                txs: update(this.state.txs, { $push: result }),
            })
        })
    }
}

from pyteal import *


# For ABI
return_prefix = Bytes("base16", "0x151f7c75")  # Literally hash('return')[:4]


@Subroutine(TealType.uint64)
def add(x):
    return Seq(
        App.globalPut(Bytes("Count"), App.globalGet(Bytes("Count"))+x),
        Log(Concat(return_prefix, Itob(App.globalGet(Bytes("Count"))))),
        Approve()
    )


@Subroutine(TealType.uint64)
def deduct(x):
    return Seq(
        If(App.globalGet(Bytes("Count")) >= x, App.globalPut(
            Bytes("Count"), App.globalGet(Bytes("Count"))+x)),
        Log(Concat(return_prefix, Itob(App.globalGet(Bytes("Count"))))),
        Approve()
    )


def approval_program():

    # list of commands to run. All but last must resolve to TEAL type none i.e Only the last is allowed to resolve
    handleCreation = Seq(App.globalPut(Bytes("Count"), Int(0)), Approve())

    handleNoOp = Cond(
        [Txn.application_args[0] == MethodSignature(
            "add(uint64)uint64"), Return(add(Btoi(Txn.application_args[1])))],
        [Txn.application_args[0] == MethodSignature(
            "sub(uint64)uint64"), Return(deduct(Btoi(Txn.application_args[1])))]
    )

    # handle routing of your contract on the several transaction types
    return Cond(
        [Txn.application_id() == Int(0), handleCreation],
        # reject is a special keyword to push 0 to the stack and return fail
        # we are not allowing opting into this contract
        [Txn.on_completion() == OnComplete.OptIn, Reject()],
        # approve is a special keyword loads 1 to the stack and return
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.UpdateApplication, Approve()],
        [Txn.on_completion() == OnComplete.DeleteApplication, Approve()],
        [Txn.on_completion() == OnComplete.NoOp, handleNoOp]


    )


def clear_state_program():
    return Approve()


def get_approval():
    return compileTeal(approval_program(), mode=Mode.Application, version=6)


def get_clear():
    return compileTeal(clear_state_program(), mode=Mode.Application, version=6)


# with open("app.teal", "w") as f:
#     f.write(get_approval())


# with open("clear.teal", "w") as f:
#     f.write(get_clear())

if __name__ == "__main__":
    print(compileTeal(approval_program(), Mode.Application, version=6))

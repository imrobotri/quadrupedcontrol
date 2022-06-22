QuadrupedControl.init()
QuadrupedControl.Start()
QuadrupedControl.Height(10)
basic.forever(function () {
    QuadrupedControl.Heartbeat()
})
